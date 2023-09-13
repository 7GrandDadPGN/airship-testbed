/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { Entity } from "../Entity/Entity";
import { DamageType } from "../Damage/DamageType";
import { AllBundleItems, BundleGroupNames } from "../Util/ReferenceManagerResources";
import { ArmorType } from "./ArmorType";
import { ItemType } from "./ItemType";
export interface BlockMeta {
    health?: number;
    blockId: number;
    blockArchetype: BlockArchetype;
    prefab?: {
        path: string;
        childBlocks?: Vector3[];
    };
    placeSound?: string[];
    stepSound?: string[];
    hitSound?: string[];
    breakSound?: string[];
}
export interface AmmoMeta {
    projectileHitLayerMask: number;
    yAxisAimAdjust: number;
    damage: number;
    lifetimeSec?: number;
    gravity: number;
    onHitEntitySoundId?: string;
    onHitGroundSoundId?: string;
    onHitSoundVolume?: number;
    onHitVFXTemplate: AllBundleItems;
}
export interface HitSignal {
    Position: Vector3;
    Velocity: Vector3;
    HitEntity: Entity | undefined;
    AmmoItemType: ItemType;
}
export interface ProjectileLauncherMeta {
    ammoItemType: ItemType;
    minVelocityScaler: number;
    maxVelocityScaler: number;
    chargingWalkSpeedMultiplier?: number;
    firstPersonLaunchOffset: Vector3;
}
export interface ItemMeta {
    displayName: string;
    id: number;
    itemType: ItemType;
    /** Path to image. */
    image?: string;
    itemMechanics?: ItemMechanicsMeta;
    itemAssets?: ItemAssetsMeta;
    melee?: MeleeItemMeta;
    block?: BlockMeta;
    breakBlock?: BreakBlockMeta;
    accessoryPaths?: string[];
    projectileLauncher?: ProjectileLauncherMeta;
    ammo?: AmmoMeta;
    armor?: {
        armorType: ArmorType;
        protectionAmount: number;
    };
    pickupSound?: string[];
}
export interface ItemAssetsMeta {
    assetBundleId?: BundleGroupNames;
    onUsePrefabId?: number;
    onUseSound?: string[];
    onUseSoundVolume?: number;
}
export interface ItemMechanicsMeta {
    minChargeSeconds: number;
    maxChargeSeconds: number;
    startUpInSeconds: number;
    cooldownSeconds: number;
}
export interface DamageItemMeta {
    damage: number;
    onHitPrefabId: number;
}
export interface BreakBlockMeta extends DamageItemMeta {
    extraDamageBlockArchetype: BlockArchetype;
    extraDamage: number;
}
export declare enum BlockArchetype {
    NONE = 0,
    STONE = 1,
    WOOD = 2,
    WOOL = 3
}
export interface MeleeItemMeta extends DamageItemMeta {
    damageType: DamageType;
    canHitMultipleTargets: boolean;
}
export interface BoxCollision {
    boxHalfWidth: number;
    boxHalfHeight: number;
    boxHalfDepth: number;
    localPositionOffsetX?: number;
    localPositionOffsetY?: number;
    localPositionOffsetZ?: number;
}
