import { GetItemMeta, GetItemTypeFromBlockId } from "Shared/Item/ItemDefinitions";
import { ItemMeta } from "Shared/Item/ItemMeta";
import { ItemType } from "Shared/Item/ItemType";
import { World } from "./World";

export class Block {
	public readonly blockId: number;
	public readonly itemType: ItemType | undefined;
	public readonly itemMeta: ItemMeta | undefined;

	constructor(public readonly voxel: number, public readonly world: World) {
		this.blockId = VoxelWorld.VoxelDataToBlockId(voxel);
		this.itemType = GetItemTypeFromBlockId(this.blockId);
		if (this.itemType) {
			this.itemMeta = GetItemMeta(this.itemType);
		}
	}

	public IsAir(): boolean {
		return this.blockId === 0;
	}

	public GetBlockDefinition(): BlockDefinition {
		return this.world.GetBlockDefinition(this.blockId)!;
	}

	public GetAverageColor(): Color {
		return this.GetBlockDefinition().averageColor.GetValue(0);
	}
}
