import {
	LeaderboardServiceBridgeTopics,
	ServerBridgeApiLeaderboardDeleteEntries,
	ServerBridgeApiLeaderboardDeleteEntry,
	ServerBridgeApiLeaderboardGetRank,
	ServerBridgeApiLeaderboardGetRankRange,
	ServerBridgeApiLeaderboardResetLeaderboard,
	ServerBridgeApiLeaderboardUpdate,
} from "@Easy/Core/Server/ProtectedServices/Airship/Leaderboard/LeaderboardService";
import { Platform } from "@Easy/Core/Shared/Airship";
import { Ranking, UpdateStatsData } from "@Easy/Core/Shared/Airship/Types/AirshipLeaderboards";
import { Service } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";

/**
 * This service provides access to leaderboard information as well as methods for updating existing leaderboards.
 * Leaderboards must be created using the https://create.airship.gg website. Once a leaderboard is created, it can be
 * accessed using the name provided during setup.
 */
@Service({})
export class AirshipLeaderboardService {
	constructor() {
		if (!Game.IsServer()) return;

		Platform.Server.Leaderboard = this;
	}

	protected OnStart(): void {}

	/**
	 * Sends an update to the provided leaderboard. The scores provided are added to, subtracted from, or replace the existing
	 * scores based on the leaderboard configuration.
	 * @param leaderboardName The name of the leaderboard that should be updated with the given scores
	 * @param update An object containing a map of ids and scores.
	 */
	public async Update(leaderboardName: string, update: UpdateStatsData): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardUpdate>(
			LeaderboardServiceBridgeTopics.Update,
			LuauContext.Protected,
			leaderboardName,
			update,
		);
	}

	/**
	 * Gets the rank of a given id.
	 * @param leaderboardName The name of the leaderboard
	 * @param id The id
	 */
	public async GetRank(leaderboardName: string, id: string): Promise<Ranking | undefined> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardGetRank>(
			LeaderboardServiceBridgeTopics.GetRank,
			LuauContext.Protected,
			leaderboardName,
			id,
		);
	}

	/**
	 * Deletes an entry on the leaderboard if it exists.
	 * @param leaderboardName
	 * @param id
	 */
	public async DeleteEntry(leaderboardName: string, id: string): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardDeleteEntry>(
			LeaderboardServiceBridgeTopics.DeleteEntry,
			LuauContext.Protected,
			leaderboardName,
			id,
		);
	}

	/**
	 * Deletes a set of entries from the leaderboard if they exist.
	 * @param leaderboardName
	 * @param ids
	 */
	public async DeleteEntries(leaderboardName: string, ids: string[]): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardDeleteEntries>(
			LeaderboardServiceBridgeTopics.DeleteEntries,
			LuauContext.Protected,
			leaderboardName,
			ids,
		);
	}

	/**
	 * Clears all entries from the leaderboard. You can also reset a leaderboard using the https://create.airship.gg website.
	 * @param leaderboardName
	 */
	public async ResetLeaderboard(leaderboardName: string): Promise<void> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardResetLeaderboard>(
			LeaderboardServiceBridgeTopics.ResetLeaderboard,
			LuauContext.Protected,
			leaderboardName,
		);
	}

	/**
	 * Gets a section of the leaderboard. This function is helpful for displaying leaderboards in your game.
	 * By default, this function returns the top 100 entries.
	 *
	 * This function returns a subsection of the top 1000 entries. Rankings are tracked for users below
	 * the top 1000, but they can only be accessed using the GetRank function.
	 * @param leaderboardName The leaderboard name
	 * @param startIndex The start index of the selection. Defaults to 0, which is the top of the leaderboard.
	 * @param count The number of entries to retrieve. Defaults to 100.
	 */
	public async GetRankRange(leaderboardName: string, startIndex = 0, count = 100): Promise<Ranking[]> {
		return contextbridge.invoke<ServerBridgeApiLeaderboardGetRankRange>(
			LeaderboardServiceBridgeTopics.GetRankRange,
			LuauContext.Protected,
			leaderboardName,
			startIndex,
			count,
		);
	}
}
