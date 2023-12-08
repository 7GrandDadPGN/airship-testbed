/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { ChargingAbilityDto, ChargingAbilityEndedDto } from "../Shared/Abilities/Ability";
import { Entity } from "../Shared/Entity/Entity";
import { GroundItem } from "../Shared/GroundItem/GroundItem";
import { ItemType } from "../Shared/Item/ItemType";
import { BeforeBlockPlacedSignal } from "../Shared/Signals/BeforeBlockPlacedSignal";
import { BlockGroupPlaceSignal, BlockPlaceSignal } from "../Shared/Signals/BlockPlaceSignal";
import { Team } from "../Shared/Team/Team";
import { ChangeTeamSignal } from "../Shared/Team/TeamJoinSignal";
import { Signal } from "../Shared/Util/Signal";
import { Block } from "../Shared/VoxelWorld/Block";
import { BeforeBlockGroupHitSignal, BeforeBlockHitSignal } from "./Services/Block/Signal/BeforeBlockHitSignal";
import { BlockDropItemSignal } from "./Services/Block/Signal/BlockDestroyedSignal";
import { ProjectileCollideServerSignal } from "./Services/Damage/Projectile/ProjectileCollideServerSignal";
import { BeforeEntityDropItemSignal } from "./Signals/BeforeEntityDropItemSignal";
import { BeforeEntitySpawnServerEvent } from "./Signals/BeforeEntitySpawnServerEvent";
import { EntityDamageServerSignal } from "./Signals/EntityDamageServerSignal";
import { EntityDeathServerSignal } from "./Signals/EntityDeathServerSignal";
import { EntityDropItemSignal } from "./Signals/EntityDropItemSignal";
import { EntitySpawnEvent } from "./Signals/EntitySpawnServerEvent";
import { MoveCommandDataEvent } from "./Signals/MoveCommandDataEvent";
import { PlayerJoinServerEvent } from "./Signals/PlayerJoinServerEvent";
import { PlayerLeaveServerEvent } from "./Signals/PlayerLeaveServerEvent";
export type BlockHitSignal = {
    blockId: number;
    blockPos: Vector3;
    readonly entity: Entity | undefined;
};
export declare const CoreServerSignals: {
    PlayerJoin: Signal<PlayerJoinServerEvent>;
    PlayerLeave: Signal<PlayerLeaveServerEvent>;
    EntityDamage: Signal<EntityDamageServerSignal>;
    EntityDeath: Signal<EntityDeathServerSignal>;
    EntityDespawn: Signal<Entity>;
    BeforeBlockPlaced: Signal<BeforeBlockPlacedSignal>;
    BlockPlace: Signal<BlockPlaceSignal>;
    BlockGroupPlace: Signal<BlockGroupPlaceSignal>;
    /** Fired **before** a block is hit. This signal is cancellable. */
    BeforeBlockHit: Signal<BeforeBlockHitSignal>;
    BeforeBlockGroupHit: Signal<BeforeBlockGroupHitSignal>;
    BlockHit: Signal<BlockHitSignal>;
    BlockDropped: Signal<BlockDropItemSignal>;
    /** Fired before a block is destroyed. */
    BeforeBlockDestroyed: Signal<{
        blockPos: Vector3;
        block: Block;
        entity?: Entity | undefined;
    }>;
    /** Fired when a block is destroyed. */
    BlockDestroyed: Signal<{
        blockPos: Vector3;
        blockId: number;
        entity?: Entity | undefined;
    }>;
    BeforeEntitySpawn: Signal<BeforeEntitySpawnServerEvent>;
    EntitySpawn: Signal<EntitySpawnEvent>;
    BeforeEntityDropItem: Signal<BeforeEntityDropItemSignal>;
    EntityDropItem: Signal<EntityDropItemSignal>;
    PlayerChangeTeam: Signal<ChangeTeamSignal>;
    /** Fired when a melee weapon is swung. */
    WeaponSwing: Signal<{
        weapon: ItemType;
        swingEntity: Entity;
    }>;
    /** Fired when a melee weapon hits. */
    WeaponHit: Signal<{
        weapon: ItemType;
        swingEntity: Entity;
        hitEntity: Entity;
        damage: number;
    }>;
    /** Fired when a projectile is fired. */
    ProjectileFired: Signal<{
        shooter: Entity;
        launcherItemType: ItemType;
        ammoItemType: ItemType;
    }>;
    /** Fired when projectile hits an object. */
    ProjectileHit: Signal<ProjectileCollideServerSignal>;
    CustomMoveCommand: Signal<MoveCommandDataEvent<unknown, unknown>>;
    EntityPickupItem: Signal<{
        entity: Entity;
        groundItem: GroundItem;
    }>;
    TeamAdded: Signal<Team>;
    AbilityAdded: Signal<{
        clientId: number;
        abilityId: string;
    }>;
    AbilityRemoved: Signal<{
        clientId: number;
        abilityId: string;
    }>;
    AbilityUsed: Signal<{
        clientId: number;
        abilityId: string;
    }>;
    AbilityEnabled: Signal<{
        clientId: number;
        abilityId: string;
    }>;
    AbilityDisabled: Signal<{
        clientId: number;
        abilityId: string;
    }>;
    AbilityChargeStarted: Signal<{
        clientId: number;
        chargingAbilityDto: ChargingAbilityDto;
    }>;
    AbilityChargeEnded: Signal<{
        clientId: number;
        chargingAbilityEndedDto: ChargingAbilityEndedDto;
    }>;
};
