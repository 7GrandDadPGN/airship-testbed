import { ProtectedUserController } from "@Easy/Core/Client/ProtectedControllers/Airship/User/UserController";
import { MainMenuController } from "@Easy/Core/Client/ProtectedControllers/MainMenuController";
import { RightClickMenuButton } from "@Easy/Core/Client/ProtectedControllers/UI/RightClickMenu/RightClickMenuButton";
import { RightClickMenuController } from "@Easy/Core/Client/ProtectedControllers/UI/RightClickMenu/RightClickMenuController";
import { Airship } from "../../Airship";
import { Dependency } from "../../Flamework";
import { Protected } from "../../Protected";
import { CanvasAPI, HoverState } from "../../Util/CanvasAPI";
import { SettingsPageSingleton } from "../Singletons/SettingsPageSingleton";
import { SettingsTab } from "./Settings/SettingsPageName";

export default class ProfileOptionsButton extends AirshipBehaviour {
	public hoverBG: Image;
	public profileImage: RawImage;
	public button: Button;
	public usernameText: TMP_Text;

	override Start(): void {
		this.usernameText.text = "";
		this.profileImage.enabled = false;
		if (Protected.Util.IsPhoneMode()) {
			this.usernameText.gameObject.SetActive(false);
		}
		Bridge.UpdateLayout(this.transform as RectTransform, true);
		task.spawn(() => {
			this.UpdatePicture();
		});
		Protected.User.onLocalUserUpdated.Connect(() => {
			task.spawn(() => {
				this.UpdatePicture();
			});
		});

		this.hoverBG.enabled = false;
		CanvasAPI.OnHoverEvent(this.button.gameObject, (hov) => {
			if (hov === HoverState.ENTER) {
				this.hoverBG.enabled = true;
			} else {
				this.hoverBG.enabled = false;
			}
		});

		CanvasAPI.OnClickEvent(this.gameObject, () => {
			if (Protected.Util.IsPhoneMode()) {
				Dependency<SettingsPageSingleton>().Open(SettingsTab.Account);
				return;
			}

			const options: RightClickMenuButton[] = [];
			options.push({
				text: "Settings",
				onClick: () => {
					Dependency<SettingsPageSingleton>().Open(SettingsTab.Account);
				},
			});
			if (!Screen.fullScreen) {
				options.push({
					text: "Go Fullscreen",
					onClick: () => {
						Screen.fullScreen = true;
					},
				});
			} else {
				options.push({
					text: "Exit Fullscreen",
					onClick: () => {
						Screen.fullScreen = false;
					},
				});
			}
			options.push({
				text: "Sign out",
				onClick: () => {
					Protected.User.Logout();
				},
			});
			options.push({
				text: "Quit",
				onClick: () => {
					Application.Quit();
				},
			});

			Dependency<RightClickMenuController>().OpenRightClickMenu(
				Dependency<MainMenuController>().mainContentCanvas,
				new Vector2(this.transform.position.x, this.transform.position.y),
				options,
			);
		});
	}

	public UpdatePicture(): void {
		const userController = Dependency<ProtectedUserController>();
		userController.WaitForLocalUser();
		if (userController.localUser) {
			this.usernameText.text = userController.localUser.username;
			Bridge.UpdateLayout(this.transform as RectTransform, true);
			Airship.Players.GetProfilePictureAsync(userController.localUser.uid).then((texture) => {
				if (texture) {
					this.profileImage.texture = texture;
					this.profileImage.enabled = true;
				}
			});
		}
	}

	override OnDestroy(): void {}
}
