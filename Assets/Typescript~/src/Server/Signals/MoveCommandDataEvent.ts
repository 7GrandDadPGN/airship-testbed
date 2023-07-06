import { DataStreamItems } from "Shared/Util/DataStreamTypes";

export class MoveCommandDataEvent<T = unknown, K = unknown> {
	constructor(
		/** Client ID. */
		public readonly clientId: number,

		/** The server tick in which the event was created. */
		public readonly tick: number,

		/** The key. Use `is` to narrow the type. */
		public readonly key: K,

		/** The value. Use `is` to narrow the type. */
		public readonly value: T,
	) {}

	/**
	 * Type-guard to ensure proper typings for the `key` and `value`.
	 *
	 * ```ts
	 * if (moveCommandDataEvent.is("SomeValidKey")) {
	 * 	const value = moveCommandDataEvent.value; // Proper type for `value`.
	 * }
	 * ```
	 */
	public is<IsK extends keyof DataStreamItems, IsT extends DataStreamItems[IsK]>(
		key: IsK,
	): this is MoveCommandDataEvent<IsT, IsK> {
		return key === (this.key as unknown);
	}
}
