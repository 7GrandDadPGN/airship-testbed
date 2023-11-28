/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
import { Entity } from "../../Shared/Entity/Entity";
export declare class AfterBlockHitClientSignal {
    readonly pos: Vector3;
    readonly blockRuntimeId: number;
    readonly entity: Entity | undefined;
    readonly damage: number;
    readonly broken: boolean;
    private blockId;
    constructor(pos: Vector3, blockRuntimeId: number, entity: Entity | undefined, damage: number, broken: boolean);
    GetBlockId(): string;
}
