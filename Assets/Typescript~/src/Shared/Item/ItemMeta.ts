import { Entity } from "Shared/Entity/Entity";
import { DamageType } from "../Damage/DamageType";
import { BundleGroupNames } from "../Util/ReferenceManagerResources";
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
	onHitGroundSoundId?: string;
	onHitGroundSoundVolume?: number;
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
	//ZoomMode: enum
}

export interface ItemMeta {
	//Identification
	displayName: string;
	ID: number;
	itemType: ItemType;

	//Game Design Mechanics
	itemMechanics: ItemMechanicsMeta;

	//Assets
	itemAssets?: ItemAssetsMeta;

	//Optional Item Archetypes
	melee?: MeleeItemMeta;
	block?: BlockMeta;
	breakBlock?: BreakBlockMeta;
	AccessoryNames?: string[];
	ProjectileLauncher?: ProjectileLauncherMeta;
	Ammo?: AmmoMeta;
	Armor?: {
		ArmorType: ArmorType;
		ProtectionAmount: number;
	};
	PickupSound?: string[];
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

export enum BlockArchetype {
	NONE,
	STONE,
	WOOD,
	WOOL,
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
