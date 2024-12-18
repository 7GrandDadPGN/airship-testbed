import { CoreLogger } from "../Logger/CoreLogger";
import { keys } from "../Util/ObjectUtils";

/**
 * The default implementation which {@link RetryHttp429} will use to retrieve the retry time from the response.
 * This can be overridden by passing a custom implementation to the {@link RetryConfig.retrieveRetryTime} property.
 * 
 * @param response The http response which is being processed due to a 429 response code.
 * @returns A number representing the number of seconds to wait before retrying the request.
 *          If undefined is returned the promise returned by {@link RetryHttp429} will be resolved with the response.
 */
function defaultRetrieveRetryTime(response: HttpResponse): number | undefined {
    return tonumber(response.GetHeader("Retry-After"));
}

/**
 * A configuration object which configures a request for the {@link RetryHttp429} function.
 */
export interface RetryConfig {
    /**
     * A key used to identify a request, when a key is rate limited all other other requests with the same key will
     *  assume the rate limit has been reached for them as well.
     * 
     * Not providing this key will disable any proactive rate limiting.
     */
    retryKey?: string;

    /**
     * Modifies the default behavior of retrieving the retry time from the response.
     * 
     * The default implementation will look for the `Retry-After` header in the response.
     * 
     * @param response The http response which is being processed due to a 429 response code.
     * @returns A number representing the number of seconds to wait before retrying the request.
     *          If undefined is returned the promise returned by {@link RetryHttp429} will be resolved with the response.
     */
    retrieveRetryTime?: (response: HttpResponse) => number | undefined;
}

class HttpTask {
    constructor(
        private readonly httpRequest: () => HttpResponse,
        public readonly config: RetryConfig,
        public readonly resolve: (response: HttpResponse) => void,
        public readonly reject: (err: any) => void
    ) {
    }

    public execute() {
        return this.httpRequest();
    }
}

interface RetryInformation {
    receivedAt: number;
    resetAfter: number;
}

const retryData: {[key: string]: RetryInformation} = {};

/**
 * @param receivedAt When the resetAfter time was received.
 * @param resetAfter The time to wait before retrying the request.
 * @returns The adjusted value of `resetAfter` based on when the value was received.
 */
function translateResetAfter(receivedAt: number, resetAfter: number): number {
    return resetAfter - (os.time() - receivedAt);
}

// clean up any unnecessary retry data every 30 seconds
task.spawnDetached(() => {
    while (task.unscaledWait(30)) {
        for (const key of keys(retryData)) {
            const retryInfo = retryData[key];
            if (translateResetAfter(retryInfo.receivedAt, retryInfo.resetAfter) <= 0) {
                delete retryData[key];
            }
        }
    }
});

/**
 * Checks if a rate limit is currently being applied to a key.
 * 
 * @param retryKey A key used to identify a type of request. When a key is rate limited all
 *  other requests with the same key will assume the rate limit has been reached for them as well.
 * @returns The time remaining before the rate limit is reset, or undefined if the key is not rate limited.
 */
function isCurrentlyLimited(retryKey: string | undefined): number | undefined {
    if (retryKey === undefined) return undefined;

    const retryInfo = retryData[retryKey];
    if (retryInfo === undefined) return undefined;

    const resetAfter = translateResetAfter(retryInfo.receivedAt, retryInfo.resetAfter);

    if (resetAfter <= 0) {
        delete retryData[retryKey];
        return undefined;
    }

    return resetAfter;
}

enum RateLimitInstructionType {
    PassThroughError = "pass_through_error",
    Retry = "retry",
    Success = "success",
}

interface RateLimitInstructionBase<T extends RateLimitInstructionType> {
    type: T;
}

/**
 * A rate limit instruction which indicates that the request is a 429 error and should be passed through.
 * This happens when the request is rate limited but the response headers don't provide a retry time.
 */
interface RateLimitPassThroughErrorInstruction extends RateLimitInstructionBase<RateLimitInstructionType.PassThroughError> {
}

/**
 * A rate limit instruction which indicates that the request should be retried.
 */
interface RateLimitRetryInstruction extends RateLimitInstructionBase<RateLimitInstructionType.Retry> {
    resetAfter: number;
}

/**
 * A rate limit instruction which indicates that the request was successful.
 */
interface RateLimitSuccessInstruction extends RateLimitInstructionBase<RateLimitInstructionType.Success> {
}

type RateLimitInstruction = RateLimitPassThroughErrorInstruction | RateLimitRetryInstruction | RateLimitSuccessInstruction;

/**
 * Determines if an executed request was rate limited.
 * 
 * @param config The configuration passed to {@link RetryHttp429}.
 * @param response The http response which is being processed due to a 429 response code.
 * @returns The time remaining before the rate limit is reset, or undefined if the request was not rate limited.
 */
function processHttpResponse(config: RetryConfig, response: HttpResponse): RateLimitInstruction {
    if (response.statusCode !== 429) return { type: RateLimitInstructionType.Success };

    const resetAfter = (config.retrieveRetryTime || defaultRetrieveRetryTime)(response);

    if (resetAfter === undefined) return { type: RateLimitInstructionType.PassThroughError };

    const retryKey = config.retryKey;

    if (retryKey !== undefined) {
        retryData[retryKey] = {
            receivedAt: os.time(),
            resetAfter: resetAfter,
        };
    }

    return { type: RateLimitInstructionType.Retry, resetAfter };
}

/**
 * Offsets the rate limit "delay" by this amount to prevent the delay from stopping ~.5 seconds before the actual reset time.
 * If a time is given in seconds without decimals then the offset has a chance of being rounded down making our delay slightly too short.
 */
const DELAY_OFFSET = 0.5;

/**
 * Executes an http task, retrying if the request is rate limited or if the {@link RetryConfig.retryKey}
 *  from {@link HttpTask.config} is actively being rate limited.
 * 
 * @param httpTask The task to be executed.
 */
function executeHttpTask(httpTask: HttpTask): void {
    const currentRateLimitResetsAt = isCurrentlyLimited(httpTask.config.retryKey);
    if (currentRateLimitResetsAt !== undefined) {
        // handle existing rate limit
        task.unscaledDelayDetached(currentRateLimitResetsAt + DELAY_OFFSET, () => executeHttpTask(httpTask));
        return;
    }

    try {
        const response = httpTask.execute();
        const instruction = processHttpResponse(httpTask.config, response);

        const retryKey = httpTask.config.retryKey;
        switch (instruction.type) {
            case RateLimitInstructionType.PassThroughError:
                // pass through 429 error
                if (retryKey !== undefined) {
                    CoreLogger.Warn(`Http request "${retryKey}" received a 429 response code but could not determine a retry time.`);
                } else {
                    CoreLogger.Warn("Http request without a retry key received a 429 response code but could not determine a retry time.");
                }
                httpTask.resolve(response);
                return;

            case RateLimitInstructionType.Retry:
                // handle active rate limit
                if (retryKey !== undefined) {
                    CoreLogger.Warn(`Http request "${retryKey}" was rate limited for ${instruction.resetAfter} seconds.`);
                } else {
                    CoreLogger.Warn(`Http request without a retry key was rate limited for ${instruction.resetAfter} seconds.`);
                }
                task.unscaledDelayDetached(instruction.resetAfter + DELAY_OFFSET, () => executeHttpTask(httpTask));
                return;

            case RateLimitInstructionType.Success:
                httpTask.resolve(response);
                return;
        }
    } catch (err) {
        httpTask.reject(err);
    }
}

/**
 * Sets up a retry mechanism for a function which returns an HttpResponse. This retry mechanism uses the
 * standard 429 response code and the "Retry-After" header (by default) to determine when to retry the request.
 * 
 * @param httpRequest A function which returns an HttpResponse. This function will be called each time the request is tried.
 * @param config An optional configuration object, see {@link RetryConfig} for more details.
 * @returns A promise which when resolved will contain the response from the request. The promise will be rejected if the request fails.
 */
export const RetryHttp429 = (httpRequest: () => HttpResponse, config: RetryConfig = {}): Promise<HttpResponse> => {
    return new Promise((resolve, reject) => {
        const httpTask = new HttpTask(httpRequest, config, resolve, reject);
        executeHttpTask(httpTask);
    });
}
