import { Controller, OnStart } from "@easy-games/flamework-core";
import { CoreNetwork } from "Shared/CoreNetwork";
import { Keyboard } from "Shared/UserInput";
import { AbilityRegistry } from "Shared/Strollers/Abilities/AbilityRegistry";
import { AbilityDto } from "Shared/Abilities/Ability";
import { AbilitySlot } from "Shared/Abilities/AbilitySlot";
import { Bin } from "Shared/Util/Bin";
import { AbilityBinding, BindingAction, BindingInputState } from "./Class/AbilityBinding";
import inspect from "@easy-games/unity-inspect";
import { SignalPriority } from "Shared/Util/Signal";
import { CoreClientSignals } from "Client/CoreClientSignals";
import { CharacterEntity } from "Shared/Entity/Character/CharacterEntity";
import { InputController, InputType } from "../Input/InputController";

const primaryKeys: ReadonlyArray<KeyCode> = [KeyCode.R, KeyCode.G, KeyCode.V];
const secondaryKeys: ReadonlyArray<KeyCode> = [KeyCode.Y, KeyCode.H, KeyCode.B];
const utilityKeys: ReadonlyArray<KeyCode> = [KeyCode.Z, KeyCode.X, KeyCode.C];

@Controller()
export class AbilitiesController implements OnStart {
	private readonly keyboard = new Keyboard();

	public primaryAbilitySlots = new Array<AbilityBinding>(primaryKeys.size());
	public secondaryAbilitySlots = new Array<AbilityBinding>(secondaryKeys.size());
	public utilityAbiltySlots = new Array<AbilityBinding>(utilityKeys.size());

	public constructor(private readonly abilityRegistry: AbilityRegistry) {
		// Set up binding slots
		for (const keyCode of primaryKeys) {
			this.primaryAbilitySlots.push(new AbilityBinding(AbilitySlot.Primary, false, keyCode));
		}

		for (const keyCode of secondaryKeys) {
			this.secondaryAbilitySlots.push(new AbilityBinding(AbilitySlot.Secondary, false, keyCode));
		}

		for (const keyCode of utilityKeys) {
			this.utilityAbiltySlots.push(new AbilityBinding(AbilitySlot.Utility, false, keyCode));
		}
	}

	private FindNextAvailableSlot(slots: Array<AbilityBinding>) {
		for (const item of slots) {
			if (item.GetBound() === undefined) {
				return item;
			}
		}

		return undefined;
	}

	private RegisterAbility(abilityDto: AbilityDto) {
		let nextSlot: AbilityBinding | undefined;
		if (abilityDto.slot === AbilitySlot.Primary) {
			nextSlot = this.FindNextAvailableSlot([
				...this.primaryAbilitySlots,
				...this.secondaryAbilitySlots,
				...this.utilityAbiltySlots,
			]);
		} else if (abilityDto.slot === AbilitySlot.Secondary) {
			nextSlot = this.FindNextAvailableSlot([
				...this.secondaryAbilitySlots,
				...this.primaryAbilitySlots,
				...this.utilityAbiltySlots,
			]);
		} else if (abilityDto.slot === AbilitySlot.Utility) {
			nextSlot = this.FindNextAvailableSlot(this.utilityAbiltySlots);
		}

		if (!nextSlot) return false;

		nextSlot.BindTo(abilityDto);
		nextSlot.BindToAction(this.keyboard, this.OnKeyboardInputEnded);

		print("registered ability at keycode ", abilityDto.id, nextSlot.GetKey());
	}

	// TODO: in future a much friendlier Input API
	private OnKeyboardInputEnded: BindingAction = (state, binding) => {
		const boundAbilityId = binding.GetBound()?.id;
		print("invoke ability", boundAbilityId);

		if (state === BindingInputState.InputEnded && boundAbilityId) {
			CoreNetwork.ClientToServer.UseAbility.Client.FireServer({
				abilityId: boundAbilityId,
			});
		}
	};

	public ObserveAbilityBindings(callback: (abilities: ReadonlyArray<AbilityBinding>) => Bin) {
		const bin = new Bin();
		bin.Add(callback([...this.primaryAbilitySlots, ...this.secondaryAbilitySlots, ...this.utilityAbiltySlots]));
		return bin;
	}

	public OnStart(): void {
		CoreNetwork.ServerToClient.AbilityAdded.Client.OnServerEvent((dto) => {
			this.RegisterAbility(dto);
		});

		// Unbind abilities on death (since it's character-bound)
		CoreClientSignals.EntitySpawn.ConnectWithPriority(SignalPriority.LOWEST, (event) => {
			if (event.entity instanceof CharacterEntity && event.entity.IsLocalCharacter()) {
				this.primaryAbilitySlots.forEach((slot) => slot.Unbind());
				this.secondaryAbilitySlots.forEach((slot) => slot.Unbind());
				this.utilityAbiltySlots.forEach((slot) => slot.Unbind());

				// Run character ability fetch
				const abilities = CoreNetwork.ClientToServer.GetAbilities.Client.FireServer();
				for (const ability of abilities) {
					this.RegisterAbility(ability);
				}
			}
		});
	}
}
