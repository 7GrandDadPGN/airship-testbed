import {
	ClientBridgeApiGetParty,
	PartyControllerBridgeTopics,
} from "@Easy/Core/Client/ProtectedControllers/Airship/Party/PartyController";
import { Platform } from "@Easy/Core/Shared/Airship";
import { Party } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipParty";
import { ContextBridgeUtil } from "@Easy/Core/Shared/Airship/Util/ContextBridgeUtil";
import { Controller } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";

/**
 * This controller provides information about the users current party.
 */
@Controller({})
export class AirshipPartyController {
	constructor() {
		if (!Game.IsClient()) return;

		Platform.Client.Party = this;
	}

	protected OnStart(): void {}

	/**
	 * Gets the users current party data.
	 */
	public async GetParty(): Promise<Party> {
		const result = await ContextBridgeUtil.PromisifyBridgeInvoke<ClientBridgeApiGetParty>(
			PartyControllerBridgeTopics.GetParty,
			LuauContext.Protected,
		);
		if (!result.success) throw result.error;
		return result.data;
	}
}
