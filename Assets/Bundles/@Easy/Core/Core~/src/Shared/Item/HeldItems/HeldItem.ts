﻿import { AudioManager } from "Shared/Audio/AudioManager";
import { EntityAnimationLayer } from "Shared/Entity/Animation/EntityAnimationLayer";
import { Bin } from "Shared/Util/Bin";
import { CSArrayUtil } from "Shared/Util/CSArrayUtil";
import { Layer } from "Shared/Util/Layer";
import { RandomUtil } from "Shared/Util/RandomUtil";
import { Task } from "Shared/Util/Task";
import { SetInterval } from "Shared/Util/Timer";
import { Entity } from "../../Entity/Entity";
import { RunUtil } from "../../Util/RunUtil";
import { TimeUtil } from "../../Util/TimeUtil";
import { ItemMeta } from "../ItemMeta";
import { ItemUtil } from "../ItemUtil";
import { AllBundleItems } from "Shared/Util/ReferenceManagerResources";

export class HeldItem {
	private serverOffsetMargin = 0.025;
	/** Undefined when holding nothing */
	protected readonly itemMeta: ItemMeta | undefined;
	protected clickBufferMargin = 0.2;
	protected readonly entity: Entity;
	private lastUsedTime = 0;
	private chargeStartTime = 0;
	protected isCharging = false;
	protected currentItemGOs: GameObject[] = [];
	protected currentItemAnimations: Animator[] = [];
	private holdingDownBin = new Bin();
	private holdingDown = false;
	private bufferingUse = false;
	protected audioPitchShift = 1;
	protected playEffectsOnUse = true;

	constructor(entity: Entity, newMeta: ItemMeta | undefined) {
		this.entity = entity;
		this.itemMeta = newMeta;
	}

	protected Log(message: string) {
		return;
		let fullMessage = "Entity: " + this.entity.id + " Item: " + this.itemMeta?.displayName + " " + message;
		print(fullMessage);
	}

	public OnEquip() {
		this.Log("OnEquip");
		//Load that items animations and play equip animation
		this.entity.animator?.EquipItem(this.itemMeta);

		//Play the equip sound
		//TODO need to make bundles string accessible for when you dont know the exact bundle you are loading
		if (this.itemMeta !== undefined) {
			let equipPath = "@Easy/Core/Shared/Resources/Sound/Items/Equip/Equip_Generic.ogg";
			if (this.itemMeta.viewModel?.equipSound) {
				equipPath = RandomUtil.FromArray(this.itemMeta.viewModel.equipSound);
			}
			if (equipPath !== "") {
				if (this.entity.IsLocalCharacter()) {
					AudioManager.PlayFullPathGlobal(equipPath, {
						volumeScale: 0.5,
					});
				} else {
					AudioManager.PlayFullPathAtPosition(equipPath, this.entity.model.transform.position, {
						volumeScale: 0.2,
					});
				}
			} else {
				error("No default equip sound found");
			}
		}

		//Spawn the accessories graphics
		let accessories: Accessory[] = [];
		if (this.itemMeta) {
			accessories = [...ItemUtil.GetAccessoriesForItemType(this.itemMeta.itemType)];
		}

		this.currentItemAnimations = [];
		this.currentItemGOs = [];
		this.entity.accessoryBuilder.RemoveAccessorySlot(AccessorySlot.LeftHand, false);
		this.entity.accessoryBuilder.RemoveAccessorySlot(AccessorySlot.RightHand, false);

		const firstPerson = this.entity.animator.IsFirstPerson();
		let layer = firstPerson ? Layer.FIRST_PERSON : Layer.CHARACTER;
		let j = 0;
		for (const accessory of accessories) {
			let added = this.entity.accessoryBuilder.SetAccessory(accessory, false);

			//Load the animator for the held item if one exists
			for (let go of CSArrayUtil.Convert(added.gameObjects)) {
				this.currentItemGOs[j] = go;
				j++;
				const anim = go.GetComponent<Animator>();
				if (anim) {
					this.currentItemAnimations.push(anim);
				}
			}
		}
		// this.entity.accessoryBuilder.TryCombineMeshes();
	}

	/**
	 * Called when the HeldItem's art assets (such as animations) should be loaded.
	 */
	public OnLoadAssets(): void {}

	public OnUnEquip() {
		this.Log("OnUnEquip");
		this.holdingDownBin.Clean();
		this.bufferingUse = false;
		this.currentItemAnimations = [];
		this.currentItemGOs = [];
		this.OnChargeEnd();
	}

	public OnCallToActionStart() {
		this.Log("OnCallToActionStart");
		if (this.HasChargeTime()) {
			this.OnChargeStart();
		} else {
			this.TryUse();
			this.HoldDownAction();
		}
	}

	private HoldDownAction() {
		if (this.itemMeta?.usable && !this.holdingDown) {
			this.holdingDown = true;
			if (this.itemMeta.usable?.canHoldToUse) {
				const holdCooldown = this.itemMeta.usable.holdToUseCooldownInSeconds;
				const cooldown = this.itemMeta.usable.cooldownSeconds;
				this.holdingDownBin.Add(
					SetInterval(holdCooldown && holdCooldown > cooldown ? holdCooldown : cooldown, () => {
						this.TryUse();
					}),
				);
			}
			this.holdingDownBin.Add(() => {
				this.holdingDown = false;
			});
		}
	}

	public OnCallToActionEnd() {
		this.Log("OnCallToActionEnd");
		this.holdingDownBin.Clean();
		if (this.isCharging) {
			this.TryChargeUse();
		}
	}

	public OnSecondaryActionStart() {
		this.OnChargeEnd();
	}

	public OnSecondaryActionEnd() {}

	public OnInspect() {
		print("OnInspect");
		let inspectPath = AllBundleItems.ItemSword_FirstPerson_Inspect as string; //Default inspect
		if (this.itemMeta?.inspectAnimPath) {
			inspectPath = this.itemMeta.inspectAnimPath;
		}
		const clip = AssetBridge.Instance.LoadAsset<AnimationClip>(inspectPath);
		this.entity.animator?.PlayAnimation(clip, EntityAnimationLayer.ITEM_ACTION, () => {
			// this.entity.anim.StartIdleAnim();
		});
	}

	protected OnChargeStart() {
		this.Log("OnChargeStart");
		this.isCharging = true;
		this.chargeStartTime = TimeUtil.GetServerTime();
	}

	protected OnChargeEnd() {
		this.Log("OnChargeEnd");
		this.isCharging = false;
		this.chargeStartTime = 0;
	}

	protected TryUse() {
		this.Log("TryUse");
		this.bufferingUse = false;
		const remainingTime = this.GetRemainingCooldownTime();
		if (remainingTime === 0) {
			this.TriggerUse(0);
			return true;
		} else if (remainingTime < this.clickBufferMargin) {
			this.bufferingUse = true;
		}
		return false;
	}

	protected TryChargeUse() {
		this.Log("TryChargeUse IsChargedUp: " + this.IsChargedUp());
		this.bufferingUse = false;

		const remainingTime = this.GetRemainingCooldownTime();
		if (remainingTime > 0) {
			// can't charge on cooldown
			return false;
		}

		if (this.IsChargedUp()) {
			this.TriggerUse(1);
			return true;
		} else {
			this.OnChargeEnd();
			return false;
		}
	}

	protected TriggerUse(useIndex: number) {
		this.Log("TriggerUse");
		this.bufferingUse = false;

		//Play the use locally
		if (RunUtil.IsClient()) {
			this.OnUseClient(useIndex);
		} else if (RunUtil.IsServer()) {
			this.OnUseServer(useIndex);
		}

		//Invoke function when cooldown should be up
		if (this.itemMeta?.usable) {
			Task.Delay(this.itemMeta.usable.cooldownSeconds + 0.01, () => {
				this.OnCooldownReset();
			});
		}
	}

	protected OnCooldownReset() {
		this.Log("OnCooldownReset: " + this.bufferingUse);
		if (this.bufferingUse) {
			this.TriggerUse(0);
		}
	}

	/** Runs when an item is used. Runs on every client.*/
	protected OnUseClient(useIndex: number) {
		this.Log("OnUse Client");
		this.lastUsedTime = TimeUtil.GetServerTime();
		this.isCharging = false;

		//Play the use locally
		if (this.playEffectsOnUse) {
			this.entity.animator.PlayUseAnim(useIndex);
			this.PlayItemSound();
		}
	}

	protected PlayItemSound() {
		if (this.itemMeta === undefined) return;
		if (this.itemMeta.usable?.onUseSound) {
			if (this.entity.IsLocalCharacter()) {
				AudioManager.PlayGlobal(RandomUtil.FromArray(this.itemMeta.usable.onUseSound), {
					volumeScale: this.itemMeta.usable.onUseSoundVolume ?? 1,
				});
			} else {
				AudioManager.PlayAtPosition(
					RandomUtil.FromArray(this.itemMeta.usable.onUseSound),
					this.entity.model.transform.position,
					{
						volumeScale: this.itemMeta.usable.onUseSoundVolume ?? 1,
					},
				);
			}
		}
	}

	// protected PlayItemAnimation(index: number, pauseOnEndFrame: boolean) {
	// 	for (let i = 0; i < this.currentItemAnimations.size(); i++) {
	// 		let anim = this.currentItemAnimations[i];
	// 		if (index >= 0) {
	// 			anim.Play("Base Layer.Use" + index);
	// 		} else {
	// 			anim.Play("Idle");
	// 		}
	// 		anim.SetBool("Hold", pauseOnEndFrame);
	// 	}
	// }

	// protected StopItemAnimation() {

	// }

	protected SetItemAnimationPauseOnEndFrame(pauseOnEndFrame: boolean) {
		for (let i = 0; i < this.currentItemAnimations.size(); i++) {
			this.currentItemAnimations[i].SetBool("Hold", pauseOnEndFrame);
		}
	}

	/** Runs when an item is used, server authorized
	 * return true if you can use the item */
	protected OnUseServer(useIndex: number) {
		this.Log("OnUse Server");
		//Update visual state to match client
		this.OnUseClient(useIndex);
	}

	public GetRemainingCooldownTime(): number {
		if (!this.itemMeta?.usable) return 0;

		let cooldown = this.itemMeta.usable.cooldownSeconds;
		this.Log(
			"Cooldown: " + cooldown + " Time: " + TimeUtil.GetServerTime() + " LastUsedTime: " + this.lastUsedTime,
		);
		//no cooldown no startup
		if (cooldown <= 0) return 0;

		//If the cooldown is down
		return math.max(0, cooldown + this.serverOffsetMargin - (TimeUtil.GetServerTime() - this.lastUsedTime));
	}

	public IsChargedUp(): boolean {
		if (!this.itemMeta?.usable) return false;

		let chargeUpMin = this.itemMeta.usable.minChargeSeconds ?? 0;
		this.Log("chargeUpMin: " + chargeUpMin);
		//no charge up time
		if (chargeUpMin <= 0) return true;

		//If we've charged up enough
		return (
			this.chargeStartTime > 0 &&
			TimeUtil.GetServerTime() - this.chargeStartTime - this.serverOffsetMargin > chargeUpMin
		);
	}

	public HasChargeTime(): boolean {
		if (!this.itemMeta?.usable) return false;

		return (this.itemMeta.usable.minChargeSeconds ?? 0) > 0;
	}
}
