import { AirshipPlayerLocation, PublicUser } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipUser";
import { Service } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { RetryHttp } from "@Easy/Core/Shared/Http/HttpRetry";
import { AirshipUrl } from "@Easy/Core/Shared/Util/AirshipUrl";

export const enum UserServiceBridgeTopics {
	GetUserByUsername = "UserService:GetUserByUsername",
	GetUserById = "UserService:GetUserById",
	GetUsersById = "UserService:GetUsersById",
	GetUserLocationsById = "UserService:GetUserLocationsById",
}

export type ServerBridgeApiGetUserByUsername = (username: string) => PublicUser | undefined;
export type ServerBridgeApiGetUserById = (userId: string) => PublicUser | undefined;
export type ServerBridgeApiGetUsersById = (userIds: string[], strict?: boolean) => { [userId: string]: PublicUser };
export type ServerBridgeApiGetUserLocationsById = (userIds: string[]) => {
	[userId: string]: AirshipPlayerLocation | undefined;
};

@Service({})
export class ProtectedUserService {
	constructor() {
		if (!Game.IsServer()) return;

		contextbridge.callback<ServerBridgeApiGetUserByUsername>(
			UserServiceBridgeTopics.GetUserByUsername,
			(_, username) => {
				return this.GetUserByUsername(username).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiGetUserById>(UserServiceBridgeTopics.GetUserById, (_, userId) => {
			return this.GetUserById(userId).expect();
		});

		contextbridge.callback<ServerBridgeApiGetUsersById>(
			UserServiceBridgeTopics.GetUsersById,
			(_, userIds, strict = false) => {
				return this.GetUsersById(userIds, strict).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiGetUserLocationsById>(
			UserServiceBridgeTopics.GetUserLocationsById,
			(_, userIds) => {
				return this.GetUserLocationsById(userIds).expect();
			},
		);
	}

	public async GetUserByUsername(username: string): Promise<ReturnType<ServerBridgeApiGetUserByUsername>> {
		const res = await RetryHttp(
			() => InternalHttpManager.GetAsync(
				`${AirshipUrl.GameCoordinator}/users/user?descriminatedUsername=${username}`,
			),
			{ retryKey: "get/game-coordinator/users/user" },
		)

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to get user. Status Code:  ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		return json.decode<{ user: PublicUser | undefined }>(res.data).user;
	}

	public async GetUserById(userId: string): Promise<ReturnType<ServerBridgeApiGetUserById>> {
		const res = await RetryHttp(
			() => InternalHttpManager.GetAsync(`${AirshipUrl.GameCoordinator}/users/uid/${userId}`),
			{ retryKey: "get/game-coordinator/users/uid/:userId" },
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to get user. Status Code:  ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		return json.decode<{ user: PublicUser | undefined }>(res.data).user;
	}

	public async GetUsersById(
		userIds: string[],
		strict: boolean = false,
	): Promise<ReturnType<ServerBridgeApiGetUsersById>> {
		if (userIds.size() === 0) {
			return {};
		}

		const res = await RetryHttp(
			() => InternalHttpManager.GetAsync(
				`${AirshipUrl.GameCoordinator}/users?users[]=${userIds.join("&users[]=")}&strict=${
					strict ? "true" : "false"
				}`,
			),
			{ retryKey: "get/game-coordinator/users" },
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to get user. Status Code:  ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		if (!res.data) {
			return {};
		}

		let array = json.decode(res.data) as PublicUser[];
		const map: Record<string, PublicUser> = {};
		array.forEach((u) => (map[u.uid] = u));

		return map;
	}

	public async GetUserLocationsById(userIds: string[]): Promise<ReturnType<ServerBridgeApiGetUserLocationsById>> {
		if (userIds.size() === 0) {
			return {};
		}

		const res = await RetryHttp(
			() => InternalHttpManager.GetAsync(
				`${AirshipUrl.GameCoordinator}/user-locations?userIds[]=${userIds.join("&userIds[]=")}`,
			),
			{ retryKey: "get/game-coordinator/user-locations" },
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to get user locations. Status Code:  ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		if (!res.data) {
			return {};
		}

		return json.decode(res.data) as ReturnType<ServerBridgeApiGetUserLocationsById>;
	}

	protected OnStart(): void {}
}
