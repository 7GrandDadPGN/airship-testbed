import { Dependency } from "@easy-games/flamework-core";
import { ChatCommand } from "Shared/Commands/ChatCommand";
import { EntityPrefabType } from "Shared/Entity/EntityPrefabType";
import { ItemStack } from "Shared/Inventory/ItemStack";
import { ArmorType } from "Shared/Item/ArmorType";
import { ItemType } from "Shared/Item/ItemType";
import { Player } from "Shared/Player/Player";
import { EntityService } from "../../Entity/EntityService";

export class EntityCommand extends ChatCommand {
	constructor() {
		super("entity", ["e"]);
	}

	public Execute(player: Player, args: string[]): void {
		const entityService = Dependency<EntityService>();

		if (!player.Character) return;

		const pos = player.Character.gameObject.transform.position;
		const entity = entityService.SpawnEntityForPlayer(undefined, EntityPrefabType.HUMAN, pos);
		entity.AddHealthbar();

		entity
			.GetInventory()
			.SetItem(entity.GetInventory().armorSlots[ArmorType.HELMET], new ItemStack(ItemType.LEATHER_HELMET));
	}
}
