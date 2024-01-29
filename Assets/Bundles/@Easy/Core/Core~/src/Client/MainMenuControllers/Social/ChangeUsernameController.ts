import { Controller, Dependency, OnStart } from "@easy-games/flamework-core";
import { CoreRefs } from "Shared/CoreRefs";
import { Game } from "Shared/Game";
import { CoreUI } from "Shared/UI/CoreUI";
import { Keyboard } from "Shared/UserInput";
import { AirshipUrl } from "Shared/Util/AirshipUrl";
import { AppManager } from "Shared/Util/AppManager";
import { CanvasAPI } from "Shared/Util/CanvasAPI";
import { ColorUtil } from "Shared/Util/ColorUtil";
import { SignalPriority } from "Shared/Util/Signal";
import { EncodeJSON } from "Shared/json";
import { AuthController } from "../Auth/AuthController";
import { UserController } from "../User/UserController";

@Controller({})
export class ChangeUsernameController implements OnStart {
	private canvas: Canvas;
	private responseText: TMP_Text;
	private submitButton: GameObject;
	private inputField: TMP_InputField;
	private inputFieldSelected = false;

	constructor(private readonly authController: AuthController) {
		const go = Object.Instantiate(
			AssetBridge.Instance.LoadAsset("@Easy/Core/Shared/Resources/Prefabs/UI/MainMenu/ChangeUsername.prefab"),
			CoreRefs.rootTransform,
		);
		this.canvas = go.GetComponent<Canvas>();
		this.canvas.enabled = false;

		const refs = go.GetComponent<GameObjectReferences>();
		this.responseText = refs.GetValue("UI", "ResponseText") as TMP_Text;
		this.submitButton = refs.GetValue("UI", "SubmitButton");
		this.inputField = refs.GetValue("UI", "SearchBar") as TMP_InputField;

		task.spawn(() => {
			const closeButton = refs.GetValue("UI", "CloseButton");
			CoreUI.SetupButton(closeButton);
			CanvasAPI.OnClickEvent(closeButton, () => {
				AppManager.Close();
			});

			CoreUI.SetupButton(this.submitButton);
			CanvasAPI.OnClickEvent(this.submitButton, () => {
				this.SubmitNameChange();
			});

			CanvasAPI.OnSelectEvent(this.inputField.gameObject, () => {
				this.inputFieldSelected = true;
			});
			CanvasAPI.OnDeselectEvent(this.inputField.gameObject, () => {
				this.inputFieldSelected = false;
			});
			const keyboard = new Keyboard();
			keyboard.anyKeyDown.ConnectWithPriority(SignalPriority.HIGH, (e) => {
				if (this.inputFieldSelected) {
					if (e.keyCode !== KeyCode.Return && e.keyCode !== KeyCode.Escape) {
						e.SetCancelled(true);
					}
				}
			});
		});
	}

	public TestAvailability(): void {}

	public SubmitNameChange(): void {
		const text = this.inputField.text;
		const split = text.split("#");
		if (split.size() !== 2) {
			this.SetResponseText("error", "Invalid name. Example: Username#0001");
			return;
		}

		if (split[1].size() !== 4) {
			this.SetResponseText("error", "Invalid tag. Example: Username#0001");
			return;
		}

		const res = HttpManager.PatchAsync(
			AirshipUrl.GameCoordinator + "/users",
			EncodeJSON({
				username: split[0],
				discriminator: split[1],
			}),
			this.authController.GetAuthHeaders(),
		);
		if (res.success) {
			this.SetResponseText("success", `Success! Your name has been changed to "${split[0]}".`);
			Game.localPlayer.UpdateUsername(split[0], split[1]);
			Dependency<UserController>().FetchLocalUser();
		} else if (res.statusCode === 409) {
			this.SetResponseText("error", `The username "${text}" is taken.`);
		} else {
			this.SetResponseText("error", "Failed to change username.");
		}
	}

	public SetResponseText(color: "success" | "error", text: string) {
		this.responseText.text = text;
		this.responseText.color =
			color === "success" ? ColorUtil.HexToColor("#62FF5F") : ColorUtil.HexToColor("#FF5C4E");
		this.responseText.gameObject.SetActive(true);
	}

	OnStart(): void {}

	public Open(): void {
		if (!this.canvas) return;

		this.inputField.text = "";
		this.SetResponseText("success", "");

		AppManager.Open(this.canvas, {
			addToStack: true,
			sortingOrderOffset: 100,
		});
	}
}
