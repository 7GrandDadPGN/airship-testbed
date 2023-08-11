/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { OnStart } from "@easy-games/flamework-core";
import { Block } from "Shared/VoxelWorld/Block";
import { EntityController } from "../Entity/EntityController";
import { InventoryController } from "../Inventory/InventoryController";
import { BlockSelectController } from "./BlockSelectController";
export declare class BlockHealthController implements OnStart {
    private readonly invController;
    private readonly blockSelectController;
    private readonly entityController;
    private blockHealthBars;
    HEALTHBAR_EXPIRE_TIME: number;
    constructor(invController: InventoryController, blockSelectController: BlockSelectController, entityController: EntityController);
    OnStart(): void;
    OnBeforeBlockHit(voxelPos: Vector3, block: Block): void;
    VisualizeBlockHealth(blockPos: Vector3): void;
    VisualizeBlockBreak(blockPos: Vector3, blockId: number): void;
    private ApplyBlockMaterial;
    private GetBlockHealth;
    private AddHealthBar;
    private RemoveHealthBar;
    private DeleteHealthBar;
}
