declare namespace task {
	/** Resumes the passed thread or function instantly using the engine's scheduler. */
	function spawn<T extends Callback>(callback: T, ...args: Parameters<T>): thread;
	function spawn(thread: thread, ...args: unknown[]): thread;

	/**
	 * Resumes the passed thread or function instantly using the engine's scheduler.
	 *
	 * This is equivalent to `task.spawn`, except the thread is not owned by the calling thread. This means
	 * that the thread will continue to run, even if the parent thread belongs to a destroyed UnityObject.
	 */
	function spawnDetached<T extends Callback>(callback: T, ...args: Parameters<T>): thread;

	/**
	 * Resumes the passed thread or function instantly using the engine's scheduler.
	 *
	 * This is like `task.spawn(thread, ...)`, except it will detach ownership from the parent thread and the thread will continue to run as if it were detached.
	 */
	function spawnDetached(thread: thread, ...args: unknown[]): thread;

	/** Resumes the passed thread or function at the end of the invocation cycle using the engine's scheduler. */
	function defer<T extends Callback>(callback: T, ...args: Parameters<T>): thread;
	function defer(thread: thread, ...args: unknown[]): thread;

	/**
	 * Resumes the passed thread or function at the end of the invocation cycle using the engine's scheduler.
	 *
	 * This is equivalent to `task.defer`, except the thread is not owned by the calling thread. This means
	 * that the thread will continue to run, even if the parent thread belongs to a destroyed UnityObject.
	 */
	function deferDetached<T extends Callback>(callback: T, ...args: Parameters<T>): thread;

	/** Resumes the passed thread or function after the elapsed `delayTime` seconds using the engine's scheduler. */
	function delay<T extends Callback>(delayTime: number, callback: T, ...args: Parameters<T>): thread;
	function delay(delayTime: number, thread: thread, ...args: unknown[]): thread;

	/**
	 * Resumes the passed thread or function after the elapsed `delayTime` seconds using the engine's scheduler.
	 *
	 * This is equivalent to `task.delay`, except the thread is not owned by the calling thread. This means
	 * that the thread will continue to run, even if the parent thread belongs to a destroyed UnityObject.
	 */
	function delayDetached<T extends Callback>(delayTime: number, callback: T, ...args: Parameters<T>): thread;

	/**
	 * Resumes the passed thread or function after the elapsed `delayTime` seconds using the engine's scheduler.
	 * This uses unscaled time (`Time.unscaledTime`), so `Time.timeScale` will not effect duration.
	 */
	function unscaledDelay<T extends Callback>(delayTime: number, callback: T, ...args: Parameters<T>): thread;

	/**
	 * Resumes the passed thread or function after the elapsed `delayTime` seconds using the engine's scheduler.
	 * This uses unscaled time (`Time.unscaledTime`), so `Time.timeScale` will not effect duration.
	 *
	 * This is equivalent to `task.unscaledDelay`, except the thread is not owned by the calling thread. This means
	 * that the thread will continue to run, even if the parent thread belongs to a destroyed UnityObject.
	 */
	function unscaledDelayDetached<T extends Callback>(delayTime: number, callback: T, ...args: Parameters<T>): thread;

	/** Yields the current thread until the next frame. Returns the delta time waited. */
	function wait(): number;
	/** Yields the current thread for `delayTime` seconds. Returns the delta time waited. */
	function wait(delayTime: number): number;
	/**
	 * Yields the current thread until the next frame. Returns the delta time waited.
	 * This uses unscaled time (`Time.unscaledTime`), so `Time.timeScale` will not effect duration.
	 */
	function unscaledWait(): number;
	/**
	 * Yields the current thread for `delayTime` seconds. Returns the delta time waited.
	 * This uses unscaled time (`Time.unscaledTime`), so `Time.timeScale` will not effect duration.
	 */
	function unscaledWait(delayTime: number): number;

	/** Cancels the given thread. */
	function cancel(thread: thread): void;
}

/** The context in which Luau is running. */
declare const enum LuauContext {
	Game = 1 << 0,
	Protected = 1 << 1,
}

declare namespace contextbridge {
	type SubscribeCallback = (fromContext: LuauContext, ...args: any[]) => void;

	/**
	 * Subscribe to broadcasts for a specific `topic`. The returned function can be called to unsubscribe the function.
	 *
	 * **NOTE**: Use with `contextbridge.broadcast()`.
	 */
	function subscribe<T extends SubscribeCallback>(topic: string, handler: T): () => void;

	/**
	 * Broadcast on a specific channel `topic` to all Luau contexts.
	 *
	 * **NOTE**: Use with `contextbridge.subscribe()`.
	 */
	function broadcast<T extends Callback>(topic: string, ...args: Parameters<T>): void;

	/**
	 * Assign a callback for a specific `topic` for the current Luau context. Only one can be assigned per context and topic pair.
	 *
	 * **NOTE**: Use with `contextbridge.invoke()`.
	 */
	function callback<T extends Callback>(
		topic: string,
		callback: (fromContext: LuauContext, ...args: Parameters<T>) => ReturnType<T>,
	): void;

	/**
	 * Invoke a callback within `toContext` for `topic`.
	 *
	 * **NOTE**: Use with `contextbridge.callback()`.
	 */
	function invoke<T extends Callback>(topic: string, toContext: LuauContext, ...args: Parameters<T>): ReturnType<T>;

	/** Gets the context of the current running thread. */
	function current(): LuauContext;
}

declare namespace json {
	/**
	 * Encodes the value as a JSON string.
	 *
	 * An optional `space` string or number can be used as a indentation. If a string
	 * is provided, the string will be used as the indentation. If a number is provided,
	 * that number of spaces will be used as the indentation.
	 *
	 * If the `space` argument is left out, the JSON string will be generated with no
	 * extra whitespace.
	 *
	 * ```ts
	 * json.encode({hello: "world"}) === `{"hello":"world"}`
	 * ```
	 */
	function encode(value: unknown, space?: string | number): string;

	/**
	 * Decodes the JSON string as a value.
	 *
	 * ```ts
	 * const data = json.decode(`{"hello":"world"}`);
	 * print(data.hello) // -> world
	 * ```
	 */
	function decode<T = unknown>(json: string): T;
}

interface DateTimeData {
	Year: number;
	/** Day of the month. */
	Day: number;
	Month: number;
	Hour: number;
	Minute: number;
	Second: number;
	Millisecond: number;
}

interface DateTime {
	/** Unix timestamp in seconds. */
	TimestampSeconds: number;

	/** Unix timestamp in milliseconds. */
	TimestampMilliseconds: number;

	/** Returns date and time information in local time. */
	ToLocalTime(): Readonly<DateTimeData>;

	/** Returns date and time information in universal time. */
	ToUniversalTime(): Readonly<DateTimeData>;

	/** Returns the ISO 8601 string representation of the DateTime object. */
	ToISO(): string;
}

interface DateTimeConstructor {
	/** Constructs a new DateTime object representing the current date and time. */
	now: () => DateTime;

	/** Constructs a DateTime object representative of the given date and time values in local time. */
	fromUniversalTime: (
		year: number,
		month?: number,
		day?: number,
		hour?: number,
		minute?: number,
		second?: number,
		millisecond?: number,
	) => DateTime;

	/** Constructs a DateTime object representative of the given date and time values in unix time. */
	fromLocalTime: (
		year: number,
		month?: number,
		day?: number,
		hour?: number,
		minute?: number,
		second?: number,
		millisecond?: number,
	) => DateTime;

	/** Constructs a DateTime object from the given unix timestamp in seconds. */
	fromTimestampSeconds: (unixTimestamp: number) => DateTime;

	/** Constructs a DateTime object from the given unix timestamp in milliseconds. */
	fromTimestampMilliseconds: (unixTimestampMs: number) => DateTime;

	/** Constructs a DateTime object by parsing the given ISO 8601 string. */
	fromISO: (iso: string) => DateTime;
}

declare const DateTime: DateTimeConstructor;
