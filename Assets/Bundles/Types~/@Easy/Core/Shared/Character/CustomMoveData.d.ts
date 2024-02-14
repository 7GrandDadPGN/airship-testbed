import { Player } from "../Player/Player";
import { DataStreamItems } from "../Util/DataStreamTypes";
export declare class CustomMoveData<T = unknown, K = unknown> {
    /** Player. */
    readonly player: Player;
    /** The server tick in which the event was created. */
    readonly tick: number;
    /** The key. Use `is` to narrow the type. */
    readonly key: K;
    /** The value. Use `is` to narrow the type. */
    readonly value: T;
    constructor(
    /** Player. */
    player: Player, 
    /** The server tick in which the event was created. */
    tick: number, 
    /** The key. Use `is` to narrow the type. */
    key: K, 
    /** The value. Use `is` to narrow the type. */
    value: T);
    /**
     * Type-guard to ensure proper typings for the `key` and `value`.
     *
     * ```ts
     * if (moveCommandDataEvent.is("SomeValidKey")) {
     * 	const value = moveCommandDataEvent.value; // Proper type for `value`.
     * }
     * ```
     */
    Is<IsK extends keyof DataStreamItems, IsT extends DataStreamItems[IsK]>(key: IsK): this is CustomMoveData<IsT, IsK>;
}
