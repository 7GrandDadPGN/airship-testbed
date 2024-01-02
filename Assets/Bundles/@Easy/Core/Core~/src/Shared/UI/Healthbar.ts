﻿import { GameObjectUtil } from "Shared/GameObject/GameObjectUtil";
import { Task } from "../Util/Task";

export interface ProgressBarOptions {
	initialPercentDelta?: number;
	fillColor?: Color;
	deathOnZero?: boolean;
}

export class Healthbar {
	private readonly TransformKey = "Transforms";
	private readonly GraphicsKey = "Graphics";
	private readonly AnimKey = "Animations";
	public Transform: RectTransform;
	private refs: GameObjectReferences;
	private fillImage: Image;
	private fillTransform: RectTransform;
	private changeFillTransform: RectTransform;
	private growthFillTransform: RectTransform;
	private graphicsHolder: RectTransform;
	private brokenGraphicsHolder: RectTransform;
	private deathAnim: Animation;

	public FillDurationInSeconds = 0.08;
	public ChangeDelayInSeconds = 0.25;
	public ChangeDurationInSeconds = 0.09;
	private enabled = true;
	public DeathOnZero = true;
	private currentDelta = -999;

	constructor(transform: Transform, options?: ProgressBarOptions) {
		this.Transform = transform.gameObject.GetComponent<RectTransform>();
		this.refs = transform.GetComponent<GameObjectReferences>();
		this.fillImage = this.refs.GetValue<Image>(this.GraphicsKey, "Fill");
		this.fillTransform = this.refs.GetValue<RectTransform>(this.TransformKey, "Fill");
		this.changeFillTransform = this.refs.GetValue<RectTransform>(this.TransformKey, "ChangeFill");
		this.growthFillTransform = this.refs.GetValue<RectTransform>(this.TransformKey, "GrowthFill");
		this.graphicsHolder = this.refs.GetValue<RectTransform>(this.TransformKey, "GraphicsHolder");
		this.brokenGraphicsHolder = this.refs.GetValue<RectTransform>(this.TransformKey, "BrokenGraphicsHolder");
		this.deathAnim = this.refs.GetValue<Animation>(this.AnimKey, "Finished");

		this.graphicsHolder.gameObject.SetActive(true);
		this.brokenGraphicsHolder.gameObject.SetActive(false);
		this.growthFillTransform.gameObject.SetActive(false);

		this.DeathOnZero = options?.deathOnZero ?? true;

		if (options?.fillColor) {
			this.SetColor(options.fillColor);
		}
		this.InstantlySetValue(options?.initialPercentDelta ?? 1);
		this.enabled = true;
	}

	public SetActive(visible: boolean) {
		this.Transform.gameObject.active = visible;
	}

	public SetColor(newColor: Color) {
		this.fillImage.color = newColor;
	}

	public InstantlySetValue(percentDelta: number) {
		this.currentDelta = percentDelta;
		let fillScale = new Vector3(percentDelta, this.fillTransform.localScale.y, this.fillTransform.localScale.z);
		this.fillTransform.localScale = fillScale;
		this.changeFillTransform.localScale = fillScale;
	}

	public SetValue(percentDelta: number) {
		if (this.currentDelta === percentDelta) {
			return;
		}

		if (this.DeathOnZero && percentDelta <= 0) {
			//Wait for the change animation
			Task.Delay(this.FillDurationInSeconds, () => {
				if (this.Transform) {
					//Play the death animation
					this.deathAnim.Play();
					this.graphicsHolder.gameObject.SetActive(false);
					this.brokenGraphicsHolder.gameObject.SetActive(true);
					Task.Delay(1.1, () => {
						if (this.Transform && this.currentDelta > 0) {
							//Reset if the progress has filled back up (Respawn)
							this.SetValue(this.currentDelta);
						}
					});
				}
			});
		} else {
			this.deathAnim.Stop();
			this.graphicsHolder.gameObject.SetActive(true);
			this.brokenGraphicsHolder.gameObject.SetActive(false);
		}

		//Animate fill down
		this.fillTransform.TweenLocalScaleX(percentDelta, this.FillDurationInSeconds);

		if (percentDelta > this.currentDelta) {
			//Growth
			this.changeFillTransform.gameObject.SetActive(false);
			this.growthFillTransform.gameObject.SetActive(true);
			this.growthFillTransform.localScale = new Vector3(
				percentDelta - this.currentDelta,
				this.growthFillTransform.localScale.y,
				this.growthFillTransform.localScale.z,
			);
			this.growthFillTransform.anchoredPosition = new Vector2(
				this.Transform.rect.width * this.currentDelta,
				this.growthFillTransform.anchoredPosition.y,
			);

			this.growthFillTransform.TweenLocalScaleX(0, this.FillDurationInSeconds);
			this.growthFillTransform.TweenAnchoredPositionX(
				this.Transform.rect.width * percentDelta,
				this.ChangeDurationInSeconds,
			);
		} else {
			//Decay
			this.growthFillTransform.gameObject.SetActive(false);
			this.changeFillTransform.gameObject.SetActive(true);

			//Hold then animate change indicator
			Task.Delay(this.ChangeDelayInSeconds, () => {
				if (!this.enabled) return;
				this.changeFillTransform.TweenLocalScaleX(percentDelta, this.ChangeDurationInSeconds);
			});
		}

		this.currentDelta = percentDelta;
	}

	public Destroy(): void {
		this.fillTransform.TweenCancelAll(false, true);
		this.changeFillTransform.TweenCancelAll(false, true);
		this.enabled = false;
		GameObjectUtil.Destroy(this.refs.gameObject);
	}
}
