import { CoreServerSignals } from "@Easy/Core/Server/CoreServerSignals";
import { PlayerService } from "@Easy/Core/Server/Services/Player/PlayerService";
import { CharacterEntity } from "@Easy/Core/Shared/Entity/Character/CharacterEntity";
import { Service } from "@easy-games/flamework-core";
import { ServerSignals } from "Server/ServerSignals";
import { AbilityId } from "Shared/Abilities/AbilityType";
import { GameAbilities } from "Shared/Strollers/Match/BW/GameAbilities";
import { MatchService } from "../MatchService";

@Service()
export class BWAbilitiesService {
	constructor(
		private readonly gameAbilities: GameAbilities,
		private readonly playerService: PlayerService,
		private readonly matchService: MatchService,
	) {
		CoreServerSignals.EntitySpawn.Connect((event) => {
			if (event.entity instanceof CharacterEntity && event.entity.player && this.matchService.IsRunning()) {
				this.AddAbilitiesToCharacter(event.entity);
			}
		});

		ServerSignals.MatchStart.Connect((event) => {
			const players = this.playerService.GetPlayers();
			for (const player of players) {
				if (!player.character) continue;
				this.AddAbilitiesToCharacter(player.character);
			}
		});
	}

	private AddAbilitiesToCharacter(characterEntity: CharacterEntity) {
		this.gameAbilities.AddAbilityToCharacter(AbilityId.RECALL, characterEntity);
	}
}
