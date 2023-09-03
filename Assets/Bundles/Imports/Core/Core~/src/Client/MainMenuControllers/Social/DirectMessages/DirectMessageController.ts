import { Controller, OnStart } from "@easy-games/flamework-core";
import { AuthController } from "Client/MainMenuControllers/Auth/AuthController";
import { SocketController } from "Client/MainMenuControllers/Socket/SocketController";
import { AudioManager } from "Shared/Audio/AudioManager";
import { Game } from "Shared/Game";
import { GameObjectUtil } from "Shared/GameObject/GameObjectUtil";
import { CoreUI } from "Shared/UI/CoreUI";
import { Bin } from "Shared/Util/Bin";
import { CanvasAPI } from "Shared/Util/CanvasAPI";
import { MapUtil } from "Shared/Util/MapUtil";
import { Signal } from "Shared/Util/Signal";
import { MainMenuController } from "../../MainMenuController";
import { FriendsController } from "../FriendsController";
import { DirectMessage } from "./DirectMessage";

@Controller({})
export class DirectMessageController implements OnStart {
	private incomingMessagePrefab = AssetBridge.LoadAsset(
		"Imports/Core/Shared/Resources/Prefabs/UI/Messages/IncomingMessage.prefab",
	) as GameObject;
	private outgoingMessagePrefab = AssetBridge.LoadAsset(
		"Imports/Core/Shared/Resources/Prefabs/UI/Messages/OutgoingMessage.prefab",
	) as GameObject;
	private messagesMap = new Map<string, Array<DirectMessage>>();
	private unreadMessageCounterMap = new Map<string, number>();

	private windowGo?: GameObject;
	private windowGoRefs?: GameObjectReferences;
	private messagesContentGo?: GameObject;
	private scrollRect?: ScrollRect;
	private openWindowBin = new Bin();
	private openedWindowUserId: string | undefined;
	private doScrollToBottom = 0;

	private directMessageReceived = new Signal<DirectMessage>();

	constructor(
		private readonly mainMenuController: MainMenuController,
		private readonly friendsController: FriendsController,
		private readonly authController: AuthController,
		private readonly socketController: SocketController,
	) {}

	OnStart(): void {
		this.Setup();

		this.socketController.On<DirectMessage>("game-coordinator/direct-message", (data) => {
			let messages = this.messagesMap.get(data.sender);
			if (messages === undefined) {
				messages = [];
				this.messagesMap.set(data.sender, messages);
			}

			messages.push(data);
			this.directMessageReceived.Fire(data);

			// sound
			AudioManager.PlayGlobal("Imports/Core/Shared/Resources/Sound/MessageReceived.wav", {
				volumeScale: 0.3,
			});

			if (
				this.openedWindowUserId === undefined ||
				this.openedWindowUserId !== data.sender
				// !Application.isFocused
			) {
				this.IncrementUnreadCounter(data.sender, 1);
			}
		});
	}

	private IncrementUnreadCounter(uid: string, amount: number): void {
		let unread = MapUtil.GetOrCreate(this.unreadMessageCounterMap, uid, 0);
		unread += amount;
		this.unreadMessageCounterMap.set(uid, unread);

		const friendGo = this.friendsController.GetFriendGo(uid);
		if (friendGo) {
			const refs = friendGo.GetComponent<GameObjectReferences>();
			const badge = refs.GetValue("UI", "UnreadBadge") as GameObject;
			const badgeText = refs.GetValue("UI", "UnreadBadgeText") as TMP_Text;

			badgeText.text = unread + "";
			badge.SetActive(true);
		}
	}

	public Setup(): void {
		this.windowGo = GameObjectUtil.InstantiateIn(
			AssetBridge.LoadAsset("Imports/Core/Shared/Resources/Prefabs/UI/Messages/DirectMessageWindow.prefab"),
			this.mainMenuController.rootCanvas.transform,
		);
		this.windowGo.GetComponent<RectTransform>().anchoredPosition = Bridge.MakeVector2(-400, -450);

		this.windowGoRefs = this.windowGo.GetComponent<GameObjectReferences>();
		this.messagesContentGo = this.windowGoRefs.GetValue("UI", "MessagesContent");
		this.scrollRect = this.windowGoRefs.GetValue("UI", "ScrollRect") as ScrollRect;

		const closeButton = this.windowGoRefs.GetValue("UI", "CloseButton");
		CoreUI.SetupButton(closeButton);
		CanvasAPI.OnClickEvent(closeButton, () => {
			this.Close();
		});

		const inputField = this.windowGoRefs!.GetValue("UI", "InputField") as TMP_InputField;
		CanvasAPI.OnInputFieldSubmit(inputField.gameObject, (data) => {
			if (this.openedWindowUserId) {
				this.SendChatMessage(this.openedWindowUserId, inputField.text);
			}
			inputField.text = "";
			inputField.ActivateInputField();
		});
		// clear notifs on select
		CanvasAPI.OnSelectEvent(inputField.gameObject, () => {
			if (this.openedWindowUserId) {
				this.unreadMessageCounterMap.set(this.openedWindowUserId, 0);
				this.ClearUnreadBadge(this.openedWindowUserId);
			}
		});

		const sendButton = this.windowGoRefs!.GetValue("UI", "SendButton");
		CoreUI.SetupButton(sendButton);
		CanvasAPI.OnClickEvent(sendButton, () => {
			if (this.openedWindowUserId) {
				this.SendChatMessage(this.openedWindowUserId, inputField.text);
			}
			inputField.text = "";
			inputField.ActivateInputField();
		});
	}

	private SendChatMessage(uid: string, message: string): void {
		if (message === "") return;
		this.socketController.Emit("send-direct-message", {
			target: uid,
			text: message,
		});
		const sentMessage: DirectMessage = {
			sender: Game.LocalPlayer.userId,
			sentAt: os.time(),
			text: message,
		};
		this.GetMessages(uid).push(sentMessage);
		this.RenderChatMessage(sentMessage, true);
	}

	private RenderChatMessage(dm: DirectMessage, receivedWhileOpen: boolean): void {
		let outgoing = dm.sender === Game.LocalPlayer.userId;

		let messageGo: GameObject;
		if (outgoing) {
			messageGo = GameObjectUtil.InstantiateIn(this.outgoingMessagePrefab, this.messagesContentGo!.transform);
		} else {
			messageGo = GameObjectUtil.InstantiateIn(this.incomingMessagePrefab, this.messagesContentGo!.transform);
		}
		const messageRefs = messageGo.GetComponent<GameObjectReferences>();
		const text = messageRefs.GetValue("UI", "Text") as TMP_Text;
		text.text = dm.text;

		let doScroll = this.scrollRect!.verticalNormalizedPosition <= 0.06;

		Bridge.UpdateLayout(messageGo.transform, true);
		Bridge.UpdateLayout(this.messagesContentGo!.transform, false);

		if (doScroll) {
			this.scrollRect!.velocity = Bridge.MakeVector2(0, 0);
			this.scrollRect!.verticalNormalizedPosition = 0;
		}
	}

	public OpenFriend(uid: string): void {
		this.openWindowBin.Clean();
		this.openedWindowUserId = uid;

		let messages = this.GetMessages(uid);

		this.messagesContentGo!.ClearChildren();

		for (const dm of messages) {
			this.RenderChatMessage(dm, false);
		}
		this.openWindowBin.Add(
			this.directMessageReceived.Connect((dm) => {
				if (dm.sender === uid) {
					this.RenderChatMessage(dm, true);
				}
			}),
		);

		const headerUserRefs = this.windowGoRefs?.GetValue("UI", "HeaderUserRefs") as GameObjectReferences;
		let friendStatus = this.friendsController.GetFriendStatus(uid);
		if (!friendStatus) {
			Debug.LogError("Failed to find friend status.");
			return;
		}

		this.friendsController.UpdateFriendStatusUI(friendStatus, headerUserRefs, {
			loadImage: true,
		});

		this.windowGo!.transform.TweenAnchoredPositionY(0, 0.1);

		Bridge.UpdateLayout(this.messagesContentGo!.transform, false);
		this.scrollRect!.velocity = Bridge.MakeVector2(0, 0);
		this.scrollRect!.verticalNormalizedPosition = 0;

		const inputField = this.windowGoRefs!.GetValue("UI", "InputField") as TMP_InputField;
		inputField.ActivateInputField();

		// clear notifs
		this.unreadMessageCounterMap.set(uid, 0);
		this.ClearUnreadBadge(uid);
	}

	private ClearUnreadBadge(uid: string): void {
		const friendGo = this.friendsController.GetFriendGo(uid);
		if (friendGo) {
			friendGo.GetComponent<GameObjectReferences>().GetValue("UI", "UnreadBadge").SetActive(false);
		}
	}

	private GetMessages(uid: string): Array<DirectMessage> {
		return MapUtil.GetOrCreate(this.messagesMap, uid, []);
	}

	public Close(): void {
		this.windowGo?.transform.TweenAnchoredPositionY(-450, 0.1);
		this.openedWindowUserId = undefined;
	}
}
