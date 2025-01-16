import { Party } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipParty";
import { Controller } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { AirshipUrl } from "@Easy/Core/Shared/Util/AirshipUrl";
import { SocketController } from "../../Socket/SocketController";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { HttpRetry } from "@Easy/Core/Shared/Http/HttpRetry";

export const enum PartyControllerBridgeTopics {
	GetParty = "PartyController:GetParty",
	OnPartyChange = "PartyController:OnPartyChange",
}

export type ClientBridgeApiGetParty = () => Party;

@Controller({})
export class ProtectedPartyController {
	public readonly onPartyChange = new Signal<Party>();

	constructor(private readonly socketController: SocketController) {
		if (!Game.IsClient()) return;

		contextbridge.callback<ClientBridgeApiGetParty>(PartyControllerBridgeTopics.GetParty, (_) => {
			return this.GetParty().expect();
		});

		this.socketController.On<Party>("game-coordinator/party-update", (data) => {
			this.onPartyChange.Fire(data);
			contextbridge.invoke(PartyControllerBridgeTopics.OnPartyChange, LuauContext.Game, data);
		});
	}

	public async GetParty(): Promise<ReturnType<ClientBridgeApiGetParty>> {
		const res = await HttpRetry(() =>
			InternalHttpManager.GetAsync(`${AirshipUrl.GameCoordinator}/parties/party/self`),
			{ retryKey: "get/game-coordinator/parties/party/self" }
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to get user pary. Status Code: ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		return json.decode<{ party: Party }>(res.data).party;
	}

	public async InviteToParty(userId: string) {
		await HttpRetry(() => InternalHttpManager.PostAsync(
			AirshipUrl.GameCoordinator + "/parties/party/invite",
			json.encode({
				userToAdd: userId,
			}),
		), { retryKey: "post/game-coordinator/parties/party/invite" });
	}

	protected OnStart(): void {}
}
