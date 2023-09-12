import { Controller, OnStart } from "@easy-games/flamework-core";
import { ProximityPrompt } from "Imports/Core/Client/Controllers/ProximityPrompt/ProximityPrompt";
import { Entity } from "Imports/Core/Shared/Entity/Entity";
import { Task } from "Imports/Core/Shared/Util/Task";
import { Network } from "Shared/Network";
import { ItemShopController } from "../Global/ItemShop/ItemShopController";
import { TeamUpgradeController } from "../Global/TeamUpgrade/TeamUpgradeController";

/** Proximity prompt offset. */
const PROXIMITY_PROMPT_OFFSET = new Vector3(0, -0.2, 0);

@Controller({})
export class ShopkeeperController implements OnStart {
	constructor(
		private readonly teamUpgradeController: TeamUpgradeController,
		private readonly itemShopController: ItemShopController,
	) {}

	OnStart(): void {
		Network.ServerToClient.ItemShop.AddNPCs.Client.OnServerEvent((entityIds) => {
			for (const id of entityIds) {
				Task.Spawn(async () => {
					const entity = await Entity.WaitForId(id);
					if (!entity) {
						warn("Failed to find Item Shop entity: " + id);
						return;
					}
					const prompt = new ProximityPrompt({
						promptPosition: entity.GetHeadPosition().add(PROXIMITY_PROMPT_OFFSET),
						activationKey: KeyCode.F,
						activationKeyString: "F",
						activationRange: 3.5,
						bottomText: "Item Shop",
						topText: "Open",
					});
					/* Open shop UI on prompt activation. */
					prompt.OnActivated.Connect(() => {
						this.itemShopController.Open();
					});
				});
			}
		});
		Network.ServerToClient.TeamUpgradeShop.AddNPCs.Client.OnServerEvent((entityIds) => {
			for (const id of entityIds) {
				Task.Spawn(async () => {
					const entity = await Entity.WaitForId(id);
					if (!entity) {
						warn("Failed to find Team Upgrades entity: " + id);
						return;
					}
					const prompt = new ProximityPrompt({
						promptPosition: entity.GetHeadPosition().add(PROXIMITY_PROMPT_OFFSET),
						activationKey: KeyCode.F,
						activationKeyString: "F",
						activationRange: 3.5,
						bottomText: "Team Upgrades",
						topText: "Open",
					});
					/* Open shop UI on prompt activation. */
					prompt.OnActivated.Connect(() => {
						this.teamUpgradeController.Open();
					});
				});
			}
		});
	}
}
