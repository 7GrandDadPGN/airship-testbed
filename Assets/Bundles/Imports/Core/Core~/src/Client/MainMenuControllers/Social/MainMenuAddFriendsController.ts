import { Controller, OnStart } from "@easy-games/flamework-core";
import { GameObjectUtil } from "Shared/GameObject/GameObjectUtil";
import { Keyboard } from "Shared/UserInput";
import { AppManager } from "Shared/Util/AppManager";
import { CanvasAPI } from "Shared/Util/CanvasAPI";
import { ColorUtil } from "Shared/Util/ColorUtil";
import { AirshipUrl } from "Shared/Util/Url";
import { encode } from "Shared/json";
import { AuthController } from "../Auth/AuthController";

@Controller({})
export class MainMenuAddFriendsController implements OnStart {
	private sendRequests = new Set<string>();

	private canvas: Canvas | undefined;

	constructor(private readonly authController: AuthController) {}

	OnStart(): void {}

	public Open(): void {
		if (this.canvas === undefined) {
			const go = GameObjectUtil.Instantiate(
				AssetBridge.LoadAsset("Imports/Core/Shared/Resources/Prefabs/UI/MainMenu/AddFriends.prefab"),
			);
			this.canvas = go.GetComponent<Canvas>();
			this.canvas.enabled = false;

			const refs = go.GetComponent<GameObjectReferences>();
			const searchInput = refs.GetValue("UI", "SearchBar") as TMP_InputField;
			const closeButton = refs.GetValue("UI", "CloseButton");
			const responseText = refs.GetValue("UI", "ResponseText") as TMP_Text;
			const sentRequestsContent = refs.GetValue("UI", "SentRequestsContent");

			sentRequestsContent.ClearChildren();

			const SetResponseText = (color: "success" | "error", text: string) => {
				responseText.text = text;
				responseText.color =
					color === "success" ? ColorUtil.HexToColor("#62FF5F") : ColorUtil.HexToColor("#FF5C4E");
				responseText.gameObject.SetActive(true);
			};

			const SendFriendRequest = (username: string) => {
				const res = HttpManager.PostAsync(
					AirshipUrl.UserService + "/friends/requests/self",
					encode({
						discriminatedUsername: username,
					}),
					this.authController.GetAuthHeaders(),
				);
				if (res.statusCode === 200) {
					SetResponseText("success", `Sent friend request to ${username}`);

					if (this.sendRequests.has(username)) {
						return;
					}
					const sentRequestGo = GameObjectUtil.InstantiateIn(
						AssetBridge.LoadAsset(
							"Imports/Core/Shared/Resources/Prefabs/UI/MainMenu/SentFriendRequest.prefab",
						),
						sentRequestsContent.transform,
					);
					const sentRefs = sentRequestGo.GetComponent<GameObjectReferences>();
					const usernameText = sentRefs.GetValue("UI", "Username") as TMP_Text;
					usernameText.text = username;

					const cancelButton = sentRefs.GetValue("UI", "CancelButton");
					CanvasAPI.OnClickEvent(cancelButton, () => {
						GameObjectUtil.Destroy(sentRequestGo);
					});
				} else if (res.statusCode === 422) {
					SetResponseText("error", `Player ${username} does not exist.`);
				} else {
					SetResponseText("error", "Failed to send friend request.");
				}
			};

			CanvasAPI.OnInputFieldSubmit(searchInput.gameObject, () => {
				print('adding friend: "' + searchInput.text + '"');
				SendFriendRequest(searchInput.text);
			});

			const keyboard = new Keyboard();
			keyboard.OnKeyDown(KeyCode.KeypadEnter, () => {
				if (searchInput.isFocused) {
					SendFriendRequest(searchInput.text);
				}
			});

			CanvasAPI.OnClickEvent(closeButton, () => {
				AppManager.Close();
			});
		}
		AppManager.Open(this.canvas);
	}
}
