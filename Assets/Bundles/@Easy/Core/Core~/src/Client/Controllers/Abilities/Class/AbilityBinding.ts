import { AbilityDto } from "Shared/Abilities/Ability";
import { AbilitySlot } from "Shared/Abilities/AbilitySlot";
import { Keyboard } from "Shared/UserInput";
import { Bin } from "Shared/Util/Bin";
import { Signal } from "Shared/Util/Signal";
import { ClientAbilityCooldownState, ClientAbilityState } from "../AbilitiesUIController";
import { Dependency } from "@easy-games/flamework-core";
import { AbilityRegistry } from "Shared/Strollers/Abilities/AbilityRegistry";

export enum BindingInputState {
	InputBegan,
	InputEnded,
}

export class BindingInput {
	public constructor(readonly state: BindingInputState, readonly keyCode: KeyCode) {}
}

export type BindingAction = (inputState: BindingInputState, binding: AbilityBinding) => void;

export class AbilityBinding {
	private bin = new Bin();
	private boundTo: AbilityDto | undefined;
	private cooldownState: ClientAbilityCooldownState | undefined;

	public readonly BindingStateChanged = new Signal<{
		oldState: ClientAbilityState | undefined;
		newState: ClientAbilityState | undefined;
	}>();

	public constructor(private readonly slot: AbilitySlot, private enabled: boolean, private keyCode: KeyCode) {}

	public SetEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	public ToAbilityState(): ClientAbilityState | undefined {
		if (!this.boundTo) return;

		const ability = Dependency<AbilityRegistry>().GetAbilityById(this.boundTo.id);
		if (!ability) {
			return;
		}

		const config = ability.config;

		return {
			keybinding: this.keyCode,
			name: config.name,
			icon: config.image,
			charges: 0,
			cooldown: this.cooldownState,
		};
	}

	public SetCooldown(cooldown: ClientAbilityCooldownState | undefined) {
		const oldState = this.ToAbilityState();

		this.cooldownState = cooldown;

		this.BindingStateChanged.Fire({
			oldState,
			newState: this.ToAbilityState(),
		});
	}

	public BindTo(abilityId: AbilityDto): void {
		const oldState = this.ToAbilityState();

		this.boundTo = abilityId;
		this.enabled = abilityId.enabled;

		this.BindingStateChanged.Fire({
			oldState,
			newState: this.ToAbilityState(),
		});
	}

	public GetKey() {
		return this.keyCode;
	}

	public GetSlot() {
		return this.slot;
	}

	public GetEnabled() {
		return this.enabled;
	}

	public BindToAction(keyboard: Keyboard, action: BindingAction) {
		this.bin.Add(
			keyboard.OnKeyUp(this.keyCode, (event) => {
				action(BindingInputState.InputEnded, this);
			}),
		);

		this.bin.Add(
			keyboard.OnKeyDown(this.keyCode, (event) => {
				action(BindingInputState.InputBegan, this);
			}),
		);
	}

	public Unbind() {
		this.boundTo = undefined;
		this.enabled = false;

		this.BindingStateChanged.Fire({
			oldState: this.ToAbilityState(),
			newState: undefined,
		});

		this.bin.Clean();
	}

	public GetBound(): AbilityDto | undefined {
		return this.boundTo;
	}
}
