import {
	ServerBridgeApiGetUserById,
	ServerBridgeApiGetUserByUsername,
	ServerBridgeApiGetUserLocationsById,
	ServerBridgeApiGetUsersById,
	UserServiceBridgeTopics,
} from "@Easy/Core/Server/ProtectedServices/Airship/User/UserService";
import { AirshipPlayerLocation, PublicUser } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipUser";
import { ContextBridgeUtil } from "@Easy/Core/Shared/Airship/Util/ContextBridgeUtil";
import { Service } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";

/**
 * Provides access to user information.
 */
@Service({})
export class AirshipUserService {
	constructor() {
		if (!Game.IsServer()) return;
	}

	protected OnStart(): void {}

	/**
	 * Gets a single user by their username.
	 * @param username The username of the user.
	 * @returns A user object
	 */
	public async GetUserByUsername(username: string): Promise<PublicUser | undefined> {
		const result = await ContextBridgeUtil.PromisifyBridgeInvoke<ServerBridgeApiGetUserByUsername>(
			UserServiceBridgeTopics.GetUserByUsername,
			LuauContext.Protected,
			username,
		);
		if (!result.success) throw result.error;
		return result.data;
	}

	/**
	 * Gets a single user by their ID.
	 * @param userId The users ID
	 * @returns A user object
	 */
	public async GetUserById(userId: string): Promise<PublicUser | undefined> {
		const result = await ContextBridgeUtil.PromisifyBridgeInvoke<ServerBridgeApiGetUserById>(
			UserServiceBridgeTopics.GetUserById,
			LuauContext.Protected,
			userId,
		);
		if (!result.success) throw result.error;
		return result.data;
	}

	/**
	 * Gets multiple users at once. This function will not succeed if it is unable to
	 * resolve all provided ids into a user.
	 * @param userIds The userIds to get.
	 * @param strict Specifies if all users must be found. If set to false, the function will
	 * succeed even if not all userIds resolve to a user.
	 * @returns An array of user objects.
	 */
	public async GetUsersById(userIds: string[], strict: boolean = false): Promise<Record<string, PublicUser>> {
		const result = await ContextBridgeUtil.PromisifyBridgeInvoke<ServerBridgeApiGetUsersById>(
			UserServiceBridgeTopics.GetUsersById,
			LuauContext.Protected,
			userIds,
			strict,
		);
		if (!result.success) throw result.error;
		return result.data;
	}

	/**
	 * Retrieves the location of a given player.
	 * @param userId The userId of the player.
	 * @returns The location of the player. If the player could not be found or is not playing the game, returns undefined.
	 */
	public async GetUserLocationById(userId: string): Promise<AirshipPlayerLocation | undefined> {
		const result = await this.GetUserLocationsById([userId]);
		return result[userId];
	}

	/**
	 * Retrieves the locations of the given players.
	 * @param userId The userIds of the players.
	 * @returns A map of userId to location. If a player could not be found or is not playing the game, they are not included in the map.
	 */
	public async GetUserLocationsById(
		userIds: string[],
	): Promise<{ [userId: string]: AirshipPlayerLocation | undefined }> {
		const result = await ContextBridgeUtil.PromisifyBridgeInvoke<ServerBridgeApiGetUserLocationsById>(
			UserServiceBridgeTopics.GetUsersById,
			LuauContext.Protected,
			userIds,
		);
		if (!result.success) throw result.error;
		return result.data;
	}
}
