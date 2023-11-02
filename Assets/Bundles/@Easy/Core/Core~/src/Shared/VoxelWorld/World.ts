import Object from "@easy-games/unity-object-utils";
import { CoreNetwork } from "Shared/CoreNetwork";
import { Game } from "Shared/Game";
import { ItemType } from "Shared/Item/ItemType";
import { RunUtil } from "Shared/Util/RunUtil";
import { Signal } from "Shared/Util/Signal";
import { BlockMeta } from "../Item/ItemMeta";
import { ItemUtil } from "../Item/ItemUtil";
import { Block } from "./Block";
import { BlockDataAPI } from "./BlockData/BlockDataAPI";

export interface PlaceBlockConfig {
	placedByEntityId?: number;
	/** True if should update collisions instantly.
	 *
	 * Defaults to true. */
	priority?: boolean;
	blockData?: {
		[key: string]: unknown;
	};
}

export class World {
	public static SKYBOX = "@Easy/Core/Shared/Resources/Skybox/BrightSky/bright_sky_2.png";

	public OnVoxelPlaced = new Signal<[pos: Vector3, voxel: number]>();
	public OnFinishedLoading = new Signal<void>();
	public OnFinishedReplicatingChunksFromServer = new Signal<void>();
	private finishedLoading = false;
	private finishedReplicatingChunksFromServer = false;

	constructor(public readonly voxelWorld: VoxelWorld) {
		voxelWorld.OnVoxelPlaced((voxel, x, y, z) => {
			const vec = new Vector3(x, y, z);
			// print("VoxelPlaced (" + x + "," + y + "," + z + ")");
			BlockDataAPI.ClearBlockData(vec);
			voxel = VoxelWorld.VoxelDataToBlockId(voxel);
			this.OnVoxelPlaced.Fire(vec, voxel);
		});

		if (!voxelWorld.finishedLoading) {
			voxelWorld.OnFinishedLoading(() => {
				print("World finished loading!");
				this.finishedLoading = true;
				this.OnFinishedLoading.Fire();
			});
		} else {
			this.finishedLoading = true;
			this.OnFinishedLoading.Fire();
		}

		if (!voxelWorld.finishedReplicatingChunksFromServer) {
			voxelWorld.OnFinishedReplicatingChunksFromServer(() => {
				this.finishedReplicatingChunksFromServer = true;
				this.OnFinishedReplicatingChunksFromServer.Fire();
			});
		} else {
			this.finishedReplicatingChunksFromServer = true;
			this.OnFinishedReplicatingChunksFromServer.Fire();
		}
	}

	public IsFinishedLoading(): boolean {
		return this.finishedLoading;
	}

	public async WaitForFinishedLoading(): Promise<void> {
		if (this.finishedLoading) return;

		return new Promise<void>((resolve) => {
			this.OnFinishedLoading.Wait();
			resolve();
		});
	}

	public IsFinishedReplicatingChunksFromServer(): boolean {
		return this.finishedReplicatingChunksFromServer;
	}

	public async WaitForFinishedReplicatingChunksFromServer(): Promise<void> {
		if (this.finishedReplicatingChunksFromServer) return;

		return new Promise<void>((resolve) => {
			this.OnFinishedReplicatingChunksFromServer.Wait();
			resolve();
		});
	}

	/**
	 *
	 * @param pos
	 * @returns Raw voxel data.
	 * @deprecated Use `GetVoxelAt()` instead.
	 */
	public GetRawVoxelDataAt(pos: Vector3): number {
		return this.voxelWorld.ReadVoxelAt(pos);
	}

	/**
	 * A more convenient version of ReadVoxelAt.
	 * @param pos
	 * @returns VoxelBlock at position.
	 */
	public GetBlockAt(pos: Vector3): Block {
		return new Block(this.voxelWorld.ReadVoxelAt(pos), this);
	}

	public GetBlockBelow(pos: Vector3): Block {
		return this.GetBlockAt(pos.add(new Vector3(0, -0.5, 0)));
	}

	public GetBlockAbove(pos: Vector3): Block {
		return this.GetBlockAt(pos.add(new Vector3(0, 0.5, 0)));
	}

	/**
	 * A way to find block data below a target. Used to know what a character is standing on
	 * @param pos
	 * @returns BlockMeta under the position.
	 */
	public GetBlockBelowMeta(pos: Vector3): BlockMeta | undefined {
		return this.GetBlockBelow(pos)?.itemMeta?.block;
	}

	public RaycastBlockBelow(startPos: Vector3, maxDistance = 10): BlockMeta | undefined {
		const raycastPoint = this.RaycastVoxel(startPos, Vector3.down, maxDistance).HitPosition.sub(
			new Vector3(0, 0.1, 0),
		);
		const block = this.GetBlockAt(raycastPoint);
		return block?.itemMeta?.block;
	}

	/**
	 * Translates the string block id to the corresponding voxel block id
	 * @param blockStringId The id of the block, e.g. `@Easy/Core:STONE`
	 * @returns The voxel block id
	 */
	public GetWorldBlockIdFromStringId(blockStringId: string): number {
		return this.voxelWorld.blocks.GetBlockIdFromStringId(blockStringId);
	}

	/**
	 * Translates the int block id to the corresponding string block id
	 * @param voxelId The integer voxel id
	 * @returns The string block id
	 */
	public GetStringIdFromWorldBlockId(voxelId: number): string {
		return this.voxelWorld.blocks.GetStringIdFromBlockId(voxelId);
	}

	public PlaceBlock(pos: Vector3, itemType: ItemType, config?: PlaceBlockConfig): void {
		const itemMeta = ItemUtil.GetItemMeta(itemType);
		if (!itemMeta.block) return;

		this.PlaceBlockByStringId(pos, itemMeta.block.blockStringId, config);
	}

	/**
	 * Places a block at the given position, with the given `blockStringId`
	 *
	 * e.g. `@Easy/Core:GRASS` (aka `ItemType.GRASS`) should spawn a grass block at that position
	 * @param pos The position of the block
	 * @param blockStringId The block type id
	 * @param config The configuration for this placed block
	 */
	public PlaceBlockByStringId(pos: Vector3, blockStringId: string, config?: PlaceBlockConfig): void {
		return this.PlaceBlockByVoxelId(pos, this.voxelWorld.blocks.GetBlockIdFromStringId(blockStringId), config);
	}

	/**
	 * Places a block at the given position, with the given `blockVoxelId`.
	 *
	 * - It's recommended you use {@link PlaceBlockByStringId} - as the voxel id isn't guaranteed to be constant
	 *
	 * @param pos The position of the block
	 * @param blockVoxelId The block voxel id
	 * @param config The configuration for this placed block
	 */
	public PlaceBlockByVoxelId(pos: Vector3, blockVoxelId: number, config?: PlaceBlockConfig): void {
		this.voxelWorld.WriteVoxelAt(pos, blockVoxelId, config?.priority ?? true);
		if (config?.blockData) {
			// print("SetBlockData (" + pos.x + "," + pos.y + "," + pos.z + ")");
			for (const key of Object.keys(config.blockData)) {
				BlockDataAPI.SetBlockData(pos, key as string, config.blockData[key]);
			}
		}

		if (RunCore.IsServer()) {
			CoreNetwork.ServerToClient.BlockPlace.Server.FireAllClients(pos, blockVoxelId, config?.placedByEntityId);
		} else {
			if (config?.placedByEntityId === Game.LocalPlayer.Character?.id) {
				// Client predicted block place event
				const clientSignals = import("Client/CoreClientSignals").expect().CoreClientSignals;
				const BlockPlaceClientSignal = import("Client/Signals/BlockPlaceClientSignal").expect()
					.BlockPlaceClientSignal;

				const block = new Block(blockVoxelId, this);
				clientSignals.BlockPlace.Fire(
					new BlockPlaceClientSignal(pos, block, Game.LocalPlayer.Character, false),
				);
			}
		}
	}

	public PlaceBlockGroupById(positions: Vector3[], blockIds: number[], config?: PlaceBlockConfig): void {
		//this.voxelWorld.WriteVoxelGroupAt(CSArrayUtil.Create(positions), blockIds, config?.priority ?? true);

		let blocks: Block[] = [];
		let binaryData: { pos: Vector3; blockId: number }[] = [];

		let keyMap: Map<string, { position: Vector3[]; data: any[] }> = new Map();
		let isLocalPrediction = config?.placedByEntityId === Game.LocalPlayer.Character?.id;

		positions.forEach((position, i) => {
			if (config?.blockData) {
				for (const key of Object.keys(config.blockData)) {
					let newMapData = keyMap.get(key as string);
					if (!newMapData) {
						newMapData = { position: [], data: [] };
					}
					newMapData.position.push(position);
					newMapData.data.push(config.blockData[key]);
					keyMap.set(key as string, newMapData);
					//BlockDataAPI.SetBlockData(position, key as string, config.blockData[key]);
				}
			}
			blocks[i] = new Block(blockIds[i], this);
			binaryData.push({ pos: position, blockId: blockIds[i] });
			if (isLocalPrediction && RunUtil.IsClient()) {
				// Client predicted block place event
				const clientSignals = import("Client/CoreClientSignals").expect().CoreClientSignals;
				const BlockPlaceClientSignal = import("Client/Signals/BlockPlaceClientSignal").expect()
					.BlockPlaceClientSignal;
				clientSignals.BlockPlace.Fire(
					new BlockPlaceClientSignal(position, blocks[i], Game.LocalPlayer.Character, true),
				);
			}
		});

		this.voxelWorld.WriteVoxelGroupAtTS(new BinaryBlob(binaryData), config?.priority ?? true);
		//Call block keys in batches based on keytype to avoid calling it per block (it sends a network event)
		keyMap.forEach((value, key) => {
			//print("Sending batch key data: " + key + ", " + value.data.size());
			BlockDataAPI.SetBlockGroupData(value.position, key, value.data);
		});
	}

	public LoadWorldFromSaveFile(binaryFile: WorldSaveFile): void {
		this.voxelWorld.LoadWorldFromSaveFile(binaryFile);
	}

	public LoadEmptyWorld(cubeMapPath: string): void {
		this.voxelWorld.LoadEmptyWorld(cubeMapPath);
	}

	public RaycastVoxel(pos: Vector3, direction: Vector3, maxDistance: number): VoxelRaycastResult {
		return this.voxelWorld.RaycastVoxel(pos, direction, maxDistance);
	}

	public GetBlockDefinition(blockId: number): BlockDefinition | undefined {
		return this.voxelWorld.blocks.GetBlockDefinitionFromIndex(blockId);
	}

	public GetBlockAverageColor(blockId: number): Color | undefined {
		return this.GetBlockDefinition(blockId)?.averageColor.GetValue(0);
	}
}
