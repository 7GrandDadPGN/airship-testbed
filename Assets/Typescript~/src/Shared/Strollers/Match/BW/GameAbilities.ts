import { AbilityConfig } from "@Easy/Core/Shared/Abilities/Ability";
import { AbilityLogic } from "@Easy/Core/Shared/Abilities/AbilityLogic";
import { CharacterEntity } from "@Easy/Core/Shared/Entity/Character/CharacterEntity";
import { AbilityRegistry } from "@Easy/Core/Shared/Strollers/Abilities/AbilityRegistry";
import { Controller, OnStart, Service } from "@easy-games/flamework-core";
import { Abilities } from "Shared/Abilities/AbilityMeta";
import { AbilityId } from "Shared/Abilities/AbilityType";

@Service()
@Controller()
export class GameAbilities implements OnStart {
	public constructor(private readonly abilitiesRegistry: AbilityRegistry) {}

	public AddAbilityToCharacter(
		abilityId: AbilityId,
		character: CharacterEntity,
		overrideConfig?: AbilityConfig,
	): AbilityLogic | undefined {
		const ability = this.abilitiesRegistry.GetAbilityById(abilityId);
		if (ability) {
			const abilities = character.GetAbilities();
			return abilities.AddAbilityWithId(abilityId, ability, overrideConfig);
		} else {
			return;
		}
	}

	public RemoveAbilityFromCharacter(abilityId: AbilityId, character: CharacterEntity): void {
		const abilities = character.GetAbilities();
		abilities.RemoveAbilityById(abilityId);
	}

	public OnStart(): void {
		for (const [abilityId, abilityMeta] of pairs(Abilities)) {
			this.abilitiesRegistry.RegisterAbilityById(abilityId as AbilityId, abilityMeta.logic, abilityMeta.config);
		}
	}
}
