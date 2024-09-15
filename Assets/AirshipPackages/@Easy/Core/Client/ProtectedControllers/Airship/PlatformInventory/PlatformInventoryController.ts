import { ItemQueryParameters } from "@Easy/Core/Shared/Airship/Types/Inputs/AirshipPlatformInventory";
import { ItemInstanceDto } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipPlatformInventory";
import { PlatformInventoryUtil } from "@Easy/Core/Shared/Airship/Util/PlatformInventoryUtil";
import { Controller } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { AirshipUrl } from "@Easy/Core/Shared/Util/AirshipUrl";
import { DecodeJSON } from "@Easy/Core/Shared/json";

export const enum PlatformInventoryControllerBridgeTopics {
	GetItems = "PartyControllerGetInventory",
}

export type ClientBridgeApiGetItems = (query?: ItemQueryParameters) => ItemInstanceDto[];

@Controller({})
export class ProtectedPlatformInventoryController {
	constructor() {
		if (!Game.IsClient()) return;

		contextbridge.callback<ClientBridgeApiGetItems>(
			PlatformInventoryControllerBridgeTopics.GetItems,
			(_, query) => {
				return this.GetItems(query).expect();
			},
		);
	}

	public async GetItems(query?: ItemQueryParameters): Promise<ReturnType<ClientBridgeApiGetItems>> {
		const res = InternalHttpManager.GetAsync(
			`${AirshipUrl.ContentService}/items/self?=${PlatformInventoryUtil.BuildItemQueryString({
				...query,
				resourceIds: [Game.organizationId, Game.gameId].filter(
					(id) => !query?.resourceIds || query.resourceIds.includes(id),
				),
			} as ItemQueryParameters)}`,
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to complete request. Status Code:  ${res.statusCode}.\n`, res.error);
			throw res.error;
		}

		return DecodeJSON(res.data) as ItemInstanceDto[];
	}

	protected OnStart(): void {}
}
