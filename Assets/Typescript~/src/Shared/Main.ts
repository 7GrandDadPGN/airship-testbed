import { Bootstrap } from "@Easy/Core/Shared/Bootstrap/Bootstrap";
import { ItemType } from "@Easy/Core/Shared/Item/ItemType";
import { RunUtil } from "@Easy/Core/Shared/Util/RunUtil";
import { BlockDataAPI, CoreBlockMetaKeys } from "@Easy/Core/Shared/VoxelWorld/BlockData/BlockDataAPI";
import { WorldAPI } from "@Easy/Core/Shared/VoxelWorld/WorldAPI";
import { BedWars } from "./BedWars/BedWars";
import { RegisterItems } from "./Item/GameItems";
import { TeamUpgradeType } from "./TeamUpgrade/TeamUpgradeType";
import { TeamUpgradeUtil } from "./TeamUpgrade/TeamUpgradeUtil";

RegisterItems();

Bootstrap.PrepareVoxelWorld();
Bootstrap.Prepare();

if (BedWars.IsMatchServer()) {
	WorldAPI.OnBlockHitDamageCalc.Connect((event) => {
		// BW: dont allow breaking your own team's bed
		const teamBlockId = BlockDataAPI.GetBlockData<string>(event.blockPos, "teamId");
		print(`itemType=${event.block.itemType} teamId=${teamBlockId}`);
		if (teamBlockId !== undefined && teamBlockId === event.entity?.player?.GetTeam()?.id) {
			print("no breaking own team's bed.");
			event.damage = 0;
		}

		// Disable breaking map blocks
		if (event.block.itemType !== ItemType.BED) {
			const canBreak = BlockDataAPI.GetBlockData<number>(event.blockPos, CoreBlockMetaKeys.CAN_BREAK);
			if (!canBreak) {
				print("no breaking map blocks.");
				event.damage = 0;
			}
		}

		if (event.entity?.player) {
			const upgradeState = TeamUpgradeUtil.GetUpgradeStateForPlayer(
				TeamUpgradeType.BREAK_SPEED,
				event.entity.player,
			);
			if (upgradeState?.currentUpgradeTier) {
				const damageMultiplier = TeamUpgradeUtil.GetUpgradeTierForType(
					TeamUpgradeType.BREAK_SPEED,
					upgradeState.currentUpgradeTier,
				).value;
				event.damage *= 1 + damageMultiplier / 100;
			}
		}
	});
}

if (RunUtil.IsServer()) {
	require("Server/Resources/TS/MainServer");
} else {
	require("Client/Resources/TS/MainClient");
}
