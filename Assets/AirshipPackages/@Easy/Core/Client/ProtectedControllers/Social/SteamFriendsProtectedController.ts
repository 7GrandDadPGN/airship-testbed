import { Controller, Dependency, OnStart } from "@Easy/Core/Shared/Flamework";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { ProtectedUserController } from "../Airship/User/UserController";
import { AirshipUser } from "@Easy/Core/Shared/Airship/Types/AirshipUser";

@Controller({})
export class SteamFriendsProtectedController implements OnStart {
	private steamFriendsWithAirship?: AirshipUser[];
	private loadedFriendsWithAirship = new Signal<[AirshipUser[]]>();
	/** Map from theoretical airship uid to steam friend info. They might not have an airship account. */
	private steamFriends = new Map<string, AirshipSteamFriendInfo>();

	OnStart(): void {
		if (!SteamLuauAPI.IsSteamInitialized()) return;

		const steamFriends = SteamLuauAPI.GetSteamFriends();
		const steamIds: string[] = [];
		for (const friendInfo of steamFriends) {
			const airshipUid = `steam:${friendInfo.steamId}`;
			steamIds.push(airshipUid);
			this.steamFriends.set(airshipUid, friendInfo);
		}
		this.LoadSteamFriendsWithAirship(steamIds);
	}

	private async LoadSteamFriendsWithAirship(steamIds: string[]) {
		const results = await Dependency<ProtectedUserController>().GetUsersById(steamIds, false);
		if (!results) {
			this.steamFriendsWithAirship = [];
			this.loadedFriendsWithAirship.Fire(this.steamFriendsWithAirship);
			return;
		}

		this.steamFriendsWithAirship = results.array;
		this.loadedFriendsWithAirship.Fire(this.steamFriendsWithAirship);
	}

	/** undefined if not yet loaded (you can use {@link WaitForSteamFriendsWithAirship}) */
	public GetSteamFriendsWithAirship(): Map<string, AirshipUser & AirshipSteamFriendInfo> | undefined {
		if (!this.steamFriendsWithAirship) return;

		const result = new Map<string, AirshipUser & AirshipSteamFriendInfo>();
		for (const friend of this.steamFriendsWithAirship) {
			const steamFriendInfo = this.steamFriends.get(friend.uid);
			if (!steamFriendInfo) continue;

			result.set(friend.uid, {
				...friend,
				// Manual decomposition of C# obj
				steamId: steamFriendInfo.steamId,
				steamName: steamFriendInfo.steamName,
				playingAirship: steamFriendInfo.playingAirship,
			});
		}
		return result;
	}

	public WaitForSteamFriendsWithAirship(): AirshipUser[] {
		if (this.steamFriendsWithAirship) return this.steamFriendsWithAirship;
		return this.loadedFriendsWithAirship.Wait()[0];
	}
}
