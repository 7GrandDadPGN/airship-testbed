/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { Entity } from "../Shared/Entity/Entity";
import { GroundItem } from "../Shared/GroundItem/GroundItem";
import { ItemType } from "../Shared/Item/ItemType";
import { Player } from "../Shared/Player/Player";
import { BeforeBlockPlacedSignal } from "../Shared/Signals/BeforeBlockPlacedSignal";
import { ChangeTeamSignal } from "../Shared/Team/TeamJoinSignal";
import { Signal } from "../Shared/Util/Signal";
import { BeforeBlockHitSignal } from "./Controllers/BlockInteractions/Signal/BeforeBlockHitSignal";
import { ProjectileCollideClientSignal } from "./Controllers/Damage/Projectile/ProjectileCollideClientSignal";
import { ProjectileLaunchedClientSignal } from "./Controllers/Damage/Projectile/ProjectileLaunchedClientSignal";
import { BlockPlaceClientSignal } from "./Signals/BlockPlaceClientSignal";
import { EntityDamageClientSignal } from "./Signals/EntityDamageClientSignal";
import { EntityDeathClientSignal } from "./Signals/EntityDeathClientSignal";
import { EntitySpawnClientSignal } from "./Signals/EntitySpawnClientEvent";
export declare const ClientSignals: {
    EntitySpawn: Signal<EntitySpawnClientSignal>;
    EntityDamage: Signal<EntityDamageClientSignal>;
    EntityDeath: Signal<EntityDeathClientSignal>;
    EntityDespawn: Signal<Entity>;
    PlayerJoin: Signal<Player>;
    PlayerLeave: Signal<Player>;
    /** Fired before a block is hit. */
    BeforeBlockHit: Signal<BeforeBlockHitSignal>;
    AfterBlockHit: Signal<{
        pos: Vector3;
        blockId: number;
        entity?: Entity | undefined;
    }>;
    /** Fired before a client-predicted block is placed. */
    BeforeBlockPlaced: Signal<BeforeBlockPlacedSignal>;
    /** Fired when a client-predicted block is placed. */
    BlockPlace: Signal<BlockPlaceClientSignal>;
    PlayerChangeTeam: Signal<ChangeTeamSignal>;
    /** Fired when local player swings melee weapon. */
    WeaponSwing: Signal<{
        weapon: ItemType;
    }>;
    /** Fired when local player's melee weapon hits. */
    WeaponHit: Signal<{
        weapon: ItemType;
        hitEntity: Entity;
    }>;
    /** Fired when local player fires a projectile. */
    ProjectileLaunched: Signal<ProjectileLaunchedClientSignal>;
    ProjectileCollide: Signal<ProjectileCollideClientSignal>;
    /** Fired when a player is eliminated. */
    PlayerEliminated: Signal<{
        player: Player;
    }>;
    SpectatorTargetChanged: Signal<{
        entity: Entity;
    }>;
    EntityPickupItem: Signal<{
        entity: Entity;
        groundItem: GroundItem;
    }>;
};
