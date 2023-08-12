/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { BlockMeta } from "Shared/Item/ItemMeta";
import { ItemType } from "Shared/Item/ItemType";
import { Player } from "Shared/Player/Player";
import { InventoryEntityAnimator, ItemPlayMode } from "./Animation/InventoryEntityAnimator";
import { EntitySerializer } from "./EntitySerializer";
export interface EntityDto {
    serializer: EntitySerializer;
    id: number;
    /** Fish-net ObjectId */
    nobId: number;
    clientId?: number;
    health: number;
    maxHealth: number;
    displayName: string;
    healthbar?: boolean;
}
export declare class EntityReferences {
    meshes: Array<Renderer>;
    fpsMesh: Renderer;
    neckBone: Transform;
    headBone: Transform;
    spineBone1: Transform;
    spineBone2: Transform;
    spineBone3: Transform;
    root: Transform;
    characterCollider: Collider;
    animationEvents: EntityAnimationEvents;
    humanEntityAnimator: CoreEntityAnimator;
    jumpSound: AudioClip | undefined;
    slideSound: AudioClip | undefined;
    landSound: AudioClip | undefined;
    constructor(ref: GameObjectReferences);
}
export declare class Entity {
    /** Entity's unique id. */
    readonly id: number;
    readonly gameObject: GameObject;
    readonly networkObject: NetworkObject;
    readonly entityDriver: EntityDriver;
    readonly model: GameObject;
    readonly attributes: EasyAttributes;
    anim?: InventoryEntityAnimator;
    readonly references: EntityReferences;
    readonly accessoryBuilder: AccessoryBuilder;
    player: Player | undefined;
    /**
     * The connection ID of whoever is controlling this entity.
     * Only exists if this entity is attached to a player.
     *
     * **This should NOT be used to uniquely identify an entity.**
     */
    readonly ClientId?: number;
    private health;
    private maxHealth;
    private dead;
    private destroyed;
    private displayName;
    private healthbarEnabled;
    private healthbar?;
    readonly OnHealthChanged: any;
    readonly OnDespawn: any;
    readonly OnPlayerChanged: any;
    readonly OnAdjustMove: any;
    readonly OnDisplayNameChanged: any;
    constructor(id: number, networkObject: NetworkObject, clientId: number | undefined);
    AddHealthbar(): void;
    SetPlayer(player: Player | undefined): void;
    SetDisplayName(displayName: string): void;
    GetHealth(): number;
    GetMaxHealth(): number;
    GetEntityDriver(): EntityDriver;
    SetHealth(health: number): void;
    SetMaxHealth(maxHealth: number): void;
    /**
     * It is recommended to use EntityService.DespawnEntity() instead of this.
     */
    Destroy(): void;
    IsDestroyed(): boolean;
    Encode(): EntityDto;
    IsPlayerOwned(): boolean;
    IsLocalCharacter(): boolean;
    IsAlive(): boolean;
    static FindById(id: number): Entity | undefined;
    static WaitForId(id: number): Promise<Entity | undefined>;
    static FindByClientId(id: number): Entity | undefined;
    static FindByCollider(collider: Collider): Entity | undefined;
    static FindByGameObject(gameObject: GameObject): Entity | undefined;
    SendItemAnimationToClients(useIndex?: number, animationMode?: ItemPlayMode, exceptClientId?: number): void;
    HasImmunity(): boolean;
    GetImmuneUntilTime(): number;
    GetLastDamagedTime(): number;
    TimeSinceLastDamaged(): number;
    SetLastDamagedTime(time: number): void;
    GrantImmunity(duration: number): void;
    GetState(): EntityState;
    GetHeadPosition(): Vector3;
    GetHeadOffset(): Vector3;
    GetMiddlePosition(): Vector3;
    LocalOffsetToWorldPoint(localOffset: Vector3): Vector3;
    GetDisplayName(): string;
    Kill(): void;
    IsDead(): boolean;
    GetBlockBelowMeta(): BlockMeta | undefined;
    GetAccessoryMeshes(slot: AccessorySlot): Renderer[];
    private PushToArray;
    LaunchProjectile(itemType: ItemType, launchPos: Vector3, velocity: Vector3): EasyProjectile | undefined;
    HasHealthbar(): boolean;
}
