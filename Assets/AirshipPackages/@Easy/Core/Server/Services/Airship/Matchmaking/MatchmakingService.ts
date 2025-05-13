import {
	MatchmakingServiceBridgeTopics,
	ServerBridgeApiCreateGroup,
	ServerBridgeApiGetGroupById,
	ServerBridgeApiGetGroupByUserId,
	ServerBridgeApiGetMatchConfig,
	ServerBridgeApiJoinQueue,
	ServerBridgeApiLeaveQueue,
} from "@Easy/Core/Server/ProtectedServices/Airship/Matchmaking/MatchmakingService";
import { Platform } from "@Easy/Core/Shared/Airship";
import { MatchConfig, Group } from "@Easy/Core/Shared/Airship/Types/Matchmaking";
import { Service } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { GameCoordinatorMatchmaking } from "@Easy/Core/Shared/TypePackages/game-coordinator-types";

@Service({})
export class AirshipMatchmakingService {
	constructor() {
		if (!Game.IsServer()) return;

		Platform.Server.Matchmaking = this;
	}

	protected OnStart(): void { }

	/**
	 * Creates a matchmaking group. Matchmaking groups allow players to enter a matchmaking queue.
	 * Players must be in a matchmaking group to join a queue. When in a queue, groups
	 * will be paired with other groups based on the queue configuration.
	 * @param userIds The userIds of the players to add to the group
	 * @returns The group that was created
	 */
	public async CreateGroup(userIds: string[]): Promise<Group> {
		return contextbridge.invoke<ServerBridgeApiCreateGroup>(
			MatchmakingServiceBridgeTopics.CreateGroup,
			LuauContext.Protected,
			userIds,
		);
	}

	/**
	 * Gets a group by its id.
	 * @param groupId The id of the group
	 * @returns The group if it exists, undefined otherwise
	 */
	public async GetGroupById(groupId: string): Promise<Group | undefined> {
		return contextbridge.invoke<ServerBridgeApiGetGroupById>(
			MatchmakingServiceBridgeTopics.GetGroupById,
			LuauContext.Protected,
			groupId,
		);
	}

	/**
	 * Gets a group by the userId of a player.
	 * @param uid The userId of the player
	 * @returns The group if it exists, undefined otherwise
	 */
	public async GetGroupByUserId(uid: string): Promise<Group | undefined> {
		return contextbridge.invoke<ServerBridgeApiGetGroupByUserId>(
			MatchmakingServiceBridgeTopics.GetGroupByUserId,
			LuauContext.Protected,
			uid,
		);
	}

	/**
	 * Given a group, joins the matchmaking queue looking for other players to play with.
	 * @param body The body of the request, containing the queueId, groupId, and information about the players in the group.
	 * @returns undefined if the request was successful. Returns an error if the user is already in a group.
	 */
	public async JoinQueue(body: GameCoordinatorMatchmaking.JoinQueueDto): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiJoinQueue>(
			MatchmakingServiceBridgeTopics.JoinQueue,
			LuauContext.Protected,
			body,
		);
	}

	/**
	 * Remove a group from a matchmaking queue.
	 * @param body The body of the request, containing the groupId.
	 * @returns undefined if the request was successful. Returns an error if the user is not in a group.
	 */
	public async LeaveQueue(groupId: string): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiLeaveQueue>(
			MatchmakingServiceBridgeTopics.LeaveQueue,
			LuauContext.Protected,
			groupId,
		);
	}

	/**
	 * Retrieves the match config for this server. The match config is provided to servers that are started
	 * by Airship to service a match for a matchmaking queue. This function will return undefined if the server
	 * was not started by the matchmaking service.
	 * @returns The match configuration if it exists.
	 */
	public async GetMatchConfig(): Promise<MatchConfig | undefined> {
		return contextbridge.invoke<ServerBridgeApiGetMatchConfig>(
			MatchmakingServiceBridgeTopics.GetMatchConfig,
			LuauContext.Protected,
		);
	}
}
