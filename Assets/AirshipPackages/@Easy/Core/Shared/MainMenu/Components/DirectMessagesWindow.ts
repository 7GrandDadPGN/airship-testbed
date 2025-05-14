import { ProtectedFriendsController } from "@Easy/Core/Client/ProtectedControllers/Social/FriendsController";
import { TransferController } from "@Easy/Core/Client/ProtectedControllers/Transfer/TransferController";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { Airship } from "../../Airship";
import { Dependency } from "../../Flamework";
import { Bin } from "../../Util/Bin";
import { CanvasAPI } from "../../Util/CanvasAPI";
import { AirshipUser, AirshipUserStatusData } from "../../Airship/Types/AirshipUser";

export default class DirectMessagesWindow extends AirshipBehaviour {
	public offlineNotice!: TMP_Text;
	public headerParty!: GameObject;
	public headerPartyProfilePictures!: GameObject;
	public profilePicturePrefab!: GameObject;
	public messagesParent!: GameObject;
	public headerUser!: GameObject;
	public messagesContent!: GameObject;
	public scrollRect!: ScrollRect;
	public inputField!: TMP_InputField;

	public partyTeleportButton!: GameObject;
	public friendTeleportButton!: GameObject;

	private bin = new Bin();

	override Start(): void { }

	private Init(): void {
		this.bin.Clean();
		this.messagesParent.ClearChildren();

		NativeTween.AnchoredPositionY(this.gameObject.GetComponent<RectTransform>()!, 5, 0.1).SetUseUnscaledTime(true);

		Bridge.UpdateLayout(this.messagesContent.transform, false);
		this.scrollRect.velocity = new Vector2(0, 0);
		this.scrollRect.verticalNormalizedPosition = 0;

		this.inputField!.ActivateInputField();
	}

	public InitAsFriendChat(user: AirshipUserStatusData): void {
		print("friend chat: " + inspect(user));
		this.Init();
		this.headerParty.SetActive(false);
		this.headerUser.SetActive(true);
		this.partyTeleportButton.SetActive(false);

		this.bin.AddEngineEventConnection(
			CanvasAPI.OnClickEvent(this.friendTeleportButton, () => {
				const friend = Dependency<ProtectedFriendsController>().GetFriendStatus(user.userId);
				if (friend?.status === "in_game" && friend?.serverId && friend.gameId) {
					print("Transferring to " + user.username + " on server " + friend.serverId);
					Dependency<TransferController>().TransferToGameAsync(friend.gameId, friend.serverId);
				}
			}),
		);

		const UpdateTeleportButton = (friend: AirshipUserStatusData) => {
			let inServer = friend.status === "in_game" && friend.serverId !== undefined && friend.gameId !== undefined;
			this.friendTeleportButton.SetActive(inServer);
		};
		UpdateTeleportButton(user);
		this.bin.Add(
			Dependency<ProtectedFriendsController>().friendStatusChanged.Connect((friend) => {
				if (friend.userId === user.userId) {
					UpdateTeleportButton(friend);
				}
			}),
		);

		this.offlineNotice.gameObject.SetActive(user.status === "offline");
	}

	public InitAsPartyChat(members: AirshipUser[]): void {
		this.Init();
		this.headerUser.gameObject.SetActive(false);
		this.offlineNotice.gameObject.SetActive(false);
		this.friendTeleportButton.SetActive(false);

		this.headerParty.SetActive(true);
		this.headerPartyProfilePictures.ClearChildren();
		this.UpdatePartyMembers(members);

		this.bin.AddEngineEventConnection(
			CanvasAPI.OnClickEvent(this.partyTeleportButton, () => {
				print("Transferring to party leader...");
				Dependency<TransferController>().TransferToPartyLeader();
			}),
		);
	}

	public UpdatePartyMembers(members: AirshipUser[]): void {
		const parentTransform = this.headerPartyProfilePictures.transform;
		this.headerPartyProfilePictures.ClearChildren();
		for (let i = members.size() - 1; i >= 0; i--) {
			const member = members[i];
			const go = Object.Instantiate(this.profilePicturePrefab, parentTransform);
			task.spawn(async () => {
				const tex = await Airship.Players.GetProfilePictureAsync(member.uid);
				if (tex && go) {
					const rawImage = go.GetComponent<RawImage>();
					if (rawImage) {
						rawImage.texture = tex;
					}
				}
			});
		}
	}

	override OnDestroy(): void { }
}
