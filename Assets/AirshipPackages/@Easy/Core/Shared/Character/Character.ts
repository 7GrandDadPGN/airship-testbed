import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import Inventory from "@Easy/Core/Shared/Inventory/Inventory";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { Signal, SignalPriority } from "@Easy/Core/Shared/Util/Signal";
import { OutfitDto } from "../Airship/Types/Outputs/AirshipPlatformInventory";
import { CoreNetwork } from "../CoreNetwork";
import { DamageInfo, DamageInfoCustomData } from "../Damage/DamageInfo";
import AirshipEmoteSingleton from "../Emote/AirshipEmoteSingleton";
import { Dependency } from "../Flamework";
import NametagComponent from "../Nametag/NametagComponent";
import CharacterAnimation from "./Animation/CharacterAnimation";
import CharacterConfigSetup from "./CharacterConfigSetup";
import { EmoteStartSignal } from "./Signal/EmoteStartSignal";

/**
 * A character is a (typically human) object in the scene. It controls movement and default animation.
 * Typically a game would spawn a character for each player. If using the default character it would
 * be dressed with their customized outfit.
 *
 * To spawn a character use {@link Player.SpawnCharacter}.
 * To control your game's default character see {@link CharacterConfigSetup}.
 */
export default class Character extends AirshipBehaviour {
	@NonSerialized()
	public player?: Player;

	@NonSerialized()
	public animation?: CharacterAnimation;

	@Header("Required References")
	public networkIdentity!: NetworkIdentity;

	@Header("Optional References")
	public movement: CharacterMovement;
	public animator: Animator;
	public animationHelper!: CharacterAnimationHelper;
	public accessoryBuilder: AccessoryBuilder;
	public model!: GameObject;
	public rigRoot!: GameObject;
	public footstepAudioSource!: AudioSource;
	@NonSerialized() public rig!: CharacterRig;

	@Header("Variables")
	public autoLoadAvatarOutfit = true;

	// State
	@NonSerialized() public id!: number;
	@NonSerialized() public state!: CharacterState;
	@Header("State")
	private health = 100;
	private maxHealth = 100;
	/** A bin that is cleaned when the entity despawns. */
	@NonSerialized() public readonly bin = new Bin();
	@NonSerialized() public inventory: Inventory;
	@NonSerialized() public outfitDto: OutfitDto | undefined;
	@NonSerialized() public isEmoting = false;

	// Signals
	@NonSerialized() public onDeath = new Signal<void>();
	@NonSerialized() public onDespawn = new Signal<void>();
	@NonSerialized() public onStateChanged = new Signal<[newState: CharacterState, oldState: CharacterState]>();
	@NonSerialized() public onHealthChanged = new Signal<[newHealth: number, oldHealth: number]>();
	@NonSerialized() public onEmoteStart = new Signal<EmoteStartSignal>();
	@NonSerialized() public onEmoteEnd = new Signal<[]>();

	private displayName = "";
	private initialized = false;
	private despawned = false;
	private prevOutfitEncoded = "";

	/*
	 * [Advanced]
	 * Listen to custom data being sent through the movement system
	 * Key Value pairs created using AddCustomMoveData will fire here during movement ticks that use them
	 * Map<id, dataBlob>, inputData, isReplay
	 */
	public OnUseCustomMoveData = new Signal<[Map<string, unknown>, CharacterMovementState, boolean]>();

	public Awake(): void {
		this.inventory = this.gameObject.GetAirshipComponent<Inventory>()!;
		this.rig = this.rigRoot?.GetComponent<CharacterRig>()!;
		this.animation = this.gameObject.GetAirshipComponent<CharacterAnimation>()!;
	}

	public LateUpdate(dt: number): void {
		// const vec = this.movement.GetLookVector();
		// // -10 is an offset to account for players naturally looking down at horizon
		// let degX = -math.deg(vec.y) - 10;
		// const spinEul = this.spineBone.rotation.eulerAngles;
		// this.spineBone.rotation = Quaternion.Euler(degX * 0.3, spinEul.y, spinEul.z);
		// const neckEul = this.headBone.rotation.eulerAngles;
		// this.headBone.rotation = Quaternion.Euler(degX * 0.8, neckEul.y, neckEul.z);
	}

	public OnEnable(): void {
		if (this.model === undefined) {
			this.model = this.gameObject;
		}

		this.despawned = false;
		this.bin.Add(
			Airship.Damage.onDamage.ConnectWithPriority(SignalPriority.MONITOR, (damageInfo) => {
				if (damageInfo.gameObject.GetInstanceID() === this.gameObject.GetInstanceID()) {
					if (this.IsDead()) return;
					let newHealth = math.max(0, this.health - damageInfo.damage);

					this.SetHealth(newHealth, true, true);

					if (Game.IsServer() && newHealth <= 0) {
						Airship.Damage.BroadcastDeath(damageInfo);
					}
				}
			}),
		);
		this.bin.Add(
			Airship.Damage.onDeath.ConnectWithPriority(SignalPriority.MONITOR, (damageInfo) => {
				if (damageInfo.gameObject === this.gameObject) {
					this.onDeath.Fire();
				}
			}),
		);

		// Custom move command data handling:
		if (this.movement) {
			const customDataConn = this.movement.OnBeginMove((moveData, isReplay) => {
				this.BeginMove(moveData, isReplay);
			});
			this.bin.Add(() => {
				Bridge.DisconnectEvent(customDataConn);
			});

			{
				// state change
				const conn = this.movement.OnStateChanged((state) => {
					if (this.state === state) return;
					const oldState = this.state;
					this.state = state;
					this.onStateChanged.Fire(state, oldState);
				});
				this.bin.Add(() => {
					Bridge.DisconnectEvent(conn);
				});
			}
		}
	}

	public OnDisable(): void {
		Airship.Characters.UnregisterCharacter(this);
		if (Game.IsClient() && !this.despawned) {
			this.bin.Clean();
			this.despawned = true;
			this.onDespawn.Fire();
			Airship.Characters.onCharacterDespawned.Fire(this);
			if (this.player?.character === this) {
				this.player?.SetCharacter(undefined);
			}
		}
	}

	public Init(player: Player | undefined, id: number, outfitDto: OutfitDto | undefined, displayName?: string): void {
		this.player = player;
		this.id = id;
		this.outfitDto = outfitDto;
		this.animation?.SetViewModelEnabled(player?.IsLocalPlayer() ?? false);
		this.health = 100;
		this.maxHealth = 100;
		this.despawned = false;
		this.initialized = true;
		this.displayName = displayName || "";

		// Client side: update the player's selected outfit to whatever this character has.
		// This may cause an issue if the character is init'd with a random outfit.
		if (player && outfitDto && Game.IsClient()) {
			player.selectedOutfit = outfitDto;
		}
		if (this.accessoryBuilder) {
			if (player) {
				this.SetMeshCacheId(`Player:${player.userId}`);
			}
			this.LoadUserOutfit(outfitDto);
		}

		if (this.movement) {
			// Apply the queued custom data to movement
			const customDataFlushedConn = this.movement.OnSetCustomData(() => {
				this.ProccessCustomMoveData();
			});
			this.bin.Add(() => {
				Bridge.DisconnectEvent(customDataFlushedConn);
			});
		}
	}

	public SetMeshCacheId(cacheId: string | undefined): void {
		// this.accessoryBuilder.meshCombiner.cacheId = cacheId ?? "";
	}

	public LoadUserOutfit(outfitDto: OutfitDto | undefined) {
		if (!this.accessoryBuilder) {
			warn("Cannot load outfit without Accessory Builder set on Character.");
			return;
		}

		this.outfitDto = outfitDto;
		//print("using outfit: " + outfitDto?.name);
		if (Game.IsClient() && outfitDto && this.autoLoadAvatarOutfit) {
			Airship.Avatar.LoadOutfit(outfitDto, this.accessoryBuilder, {
				removeOldClothingAccessories: true,
			});
			if (this.IsLocalCharacter() && Airship.Characters.viewmodel) {
				Airship.Avatar.LoadOutfit(outfitDto, Airship.Characters.viewmodel.accessoryBuilder, {
					removeOldClothingAccessories: true,
				});
			}
		}
	}

	private queuedMoveData = new Map<string, unknown>();
	/** Add custom data to the move data command stream. */
	public AddCustomMoveData(key: string, value: unknown) {
		this.queuedMoveData.set(key, value);
	}

	private ProccessCustomMoveData() {
		//Don't process if we have nothing queued
		if (this.queuedMoveData.size() === 0) {
			return;
		}
		//Convert queued data into binary blob
		let customDataQueue: { key: string; value: unknown }[] = [];
		this.queuedMoveData.forEach((value, key) => {
			customDataQueue.push({ key: key, value: value });
		});
		this.queuedMoveData.clear();
		//Pass to C#
		this.movement?.SetCustomData(new BinaryBlob(customDataQueue));
	}

	private BeginMove(stateData: CharacterMovementState, isReplay: boolean) {
		//Decode binary block into usable key value array
		const allData = stateData.currentMoveInput.customData
			? (stateData.currentMoveInput.customData.Decode() as { key: string; value: unknown }[])
			: undefined;
		const allCustomData: Map<string, unknown> = new Map();
		let usingCustomData = false;
		if (allData) {
			//print("ALLDATA: " + inspect(allData));
			for (const data of allData) {
				//print("Found custom data " + data.key + " with value: " + data.value);
				allCustomData.set(data.key, data.value);
				usingCustomData = true;
			}
		}

		if (usingCustomData) {
			//Local signal for parsing the key value pairs
			this.OnUseCustomMoveData.Fire(allCustomData, stateData, isReplay);
		}
	}

	public IsInitialized() {
		return this.initialized;
	}

	/**
	 * Yields thread until the character has been initialized.
	 */
	public WaitForInit(): void {
		while (!this.initialized) {
			task.wait();
		}
	}

	/**
	 * This can be called from the server or from the player that owns the character and has authority
	 */
	public Teleport(pos: Vector3, lookVector?: Vector3): void {
		if (!this.movement) {
			warn("Cannot teleport character: movement script missing.");
			return;
		}

		if (lookVector) {
			this.movement.TeleportAndLook(pos, lookVector);
			if (Game.IsClient()) {
				//Airship.Camera.activeCameraMode?.SetDirection(lookVector);
			}
		} else {
			this.movement.Teleport(pos);
		}
	}

	/**
	 * Despawns this character.
	 *
	 * **SERVER ONLY METHOD**
	 */
	public Despawn(): void {
		assert(Game.IsServer(), "You can only call Character.Despawn() on the server.");
		assert(!this.despawned, "Character has already been despawned");

		this.bin.Clean();
		this.despawned = true;
		this.onDespawn.Fire();
		Airship.Characters.onCharacterDespawned.Fire(this);
		if (this.player?.character === this) {
			this.player?.SetCharacter(undefined);
		}
		NetworkServer.Destroy(this.gameObject);
	}

	public InflictDamage(damage: number, attacker?: GameObject, data?: DamageInfoCustomData): void {
		Airship.Damage.InflictDamage(this.gameObject, damage, attacker, data);
	}

	public IsDestroyed(): boolean {
		return this.despawned || this.gameObject.IsDestroyed();
	}

	public IsAlive(): boolean {
		return this.health > 0;
	}

	public IsDead(): boolean {
		return !this.IsAlive();
	}

	public GetHealth(): number {
		return this.health;
	}

	/**
	 * Sets a characters health to a certain value. If the health is <= 0, the character will die.
	 *
	 * @param health The new health value.
	 * @param dontInflictDeath If true, a death event will not be fired if the character's new health is less than or equal to zero.
	 * This is useful when you want to broadcast a custom death event with {@link Airship.Damage.BroadcastDeath}.
	 */
	public SetHealth(health: number, dontInflictDeath?: boolean, noNetwork = false): void {
		if (this.health === health) return;

		const oldHealth = this.health;
		this.health = health;
		this.onHealthChanged.Fire(health, oldHealth);

		if (Game.IsServer()) {
			if (!noNetwork) {
				CoreNetwork.ServerToClient.Character.SetHealth.server.FireAllClients(this.id, health);
			}

			if (this.health <= 0 && !dontInflictDeath) {
				const damageInfo = new DamageInfo(this.gameObject, oldHealth, undefined, {});
				Airship.Damage.BroadcastDeath(damageInfo);
			}
		}
	}

	public GetMaxHealth(): number {
		return this.maxHealth;
	}

	public SetMaxHealth(maxHealth: number): void {
		this.maxHealth = maxHealth;
	}

	public SetDisplayName(displayName: string) {
		this.displayName = displayName;
		const nametag = this.gameObject.GetAirshipComponentInChildren<NametagComponent>();

		if (nametag !== undefined) {
			nametag.SetText(displayName);
		}

		if (Game.IsServer()) {
			CoreNetwork.ServerToClient.Character.SetNametag.server.FireAllClients(this.id, displayName);
		}
	}

	public GetDisplayName() {
		return this.displayName;
	}

	/**
	 * Used to check if the character is owned by the `Game.localPlayer`
	 *
	 * Must be called after the character has finished initializing.
	 * You can use {@link WaitForInit()} to wait for initialized.
	 *
	 * @returns true if the character is owned by the `Game.localPlayer`
	 */
	public IsLocalCharacter(): boolean {
		if (!this.initialized) {
			print(debug.traceback());
			error("Tried to call IsLocalCharacter() before character was initialized. Please use WaitForInit()");
		}
		return Game.IsClient() && this.player?.userId === Game.localPlayer?.userId;
	}

	/**
	 * Cancels emote if the character is emoting. Otherwise, does nothing.
	 */
	public CancelEmote(): void {
		if (!this.isEmoting) return;

		// Cancel immediately locally
		Dependency<AirshipEmoteSingleton>().StopEmoting(this);

		if (Game.IsClient() && this.IsLocalCharacter()) {
			CoreNetwork.ClientToServer.Character.EmoteCancelRequest.client.FireServer();
		}
		if (Game.IsServer()) {
			CoreNetwork.ServerToClient.Character.EmoteEnd.server.FireAllClients(this.id);
		}
	}
}
