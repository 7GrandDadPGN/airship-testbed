import { ProtectedPartyController } from "@Easy/Core/Client/ProtectedControllers/Airship/Party/PartyController";
import { ProtectedFriendsController } from "@Easy/Core/Client/ProtectedControllers/Social/FriendsController";
import { Airship } from "../../Airship";
import { PublicUser } from "../../Airship/Types/Outputs/AirshipUser";
import { Dependency } from "../../Flamework";
import { Game } from "../../Game";
import { Protected } from "../../Protected";
import { Bin } from "../../Util/Bin";
import { CanvasAPI, HoverState } from "../../Util/CanvasAPI";

export default class PartyMember extends AirshipBehaviour {
	@Header("References")
	public profileImage!: RawImage;
	public addFriendContainer!: GameObject;
	public addFriendButton!: GameObject;
	public layoutElement: LayoutElement;
	public kickButton: Button;
	public kickOverlay: GameObject;

	public partyLeaderContainer!: GameObject;
	private user!: PublicUser;
	private isLocalPlayerThePartyLeader = false;

	/** Holds add friend button functionality */
	private addFriendButtonBin: Bin | undefined;
	private bin = new Bin();

	protected Start(): void {
		this.kickOverlay.SetActive(false);
		this.bin.Add(
			this.kickButton.onClick.Connect((e) => {
				if (!this.isLocalPlayerThePartyLeader) return;
				if (this.user.uid === Game.localPlayer.userId) return;
				Dependency<ProtectedPartyController>().RemoveFromParty(this.user.uid);
			}),
		);
		CanvasAPI.OnHoverEvent(this.kickButton.gameObject, (hov) => {
			if (!this.isLocalPlayerThePartyLeader) return;
			if (this.user.uid === Game.localPlayer.userId) return;
			if (hov === HoverState.ENTER) {
				this.kickOverlay.SetActive(true);
			} else {
				this.kickOverlay.SetActive(false);
			}
		});
	}

	public SetUser(user: PublicUser, isUserLeader: boolean, isLocalPlayerThePartyLeader: boolean): void {
		this.isLocalPlayerThePartyLeader = isLocalPlayerThePartyLeader;
		this.layoutElement.layoutPriority = isUserLeader ? 2 : 1;

		this.bin.Clean();
		this.user = user;

		// Clear status icons when new user set
		this.bin.Add(() => {
			this.addFriendContainer.SetActive(false);
			this.partyLeaderContainer.SetActive(false);
		});

		this.UpdateLeaderStatus(isUserLeader);
		if (this.user.uid !== Protected.User.localUser?.uid) {
			this.UpdateFriendButton();
			Dependency<ProtectedFriendsController>().onFetchFriends.Connect(() => {
				this.UpdateFriendButton();
			});
		}

		// this.usernameText.text = user.username;

		// if (asLeader && user.uid !== Game.localPlayer.userId) {
		// 	this.bin.AddEngineEventConnection(
		// 		CanvasAPI.OnClickEvent(this.kickButton.gameObject, () => {
		// 			// InternalHttpManager.PostAsync(
		// 				AirshipUrl.GameCoordinator + "/parties/party/remove",
		// 				json.encode({
		// 					userToRemove: user.uid,
		// 				}),
		// 			);
		// 		}),
		// 	);
		// } else {
		// 	this.kickButton.gameObject.SetActive(false);
		// }

		task.spawn(async () => {
			await this.UpdatePicture();
		});
		if (user.uid === Game.localPlayer?.userId) {
			this.bin.Add(
				Protected.User.onLocalUserUpdated.Connect(() => {
					this.UpdatePicture().then(() => {});
				}),
			);
		}
	}

	public UpdateLeaderStatus(isLeader: boolean) {
		this.partyLeaderContainer.SetActive(isLeader);
	}

	private UpdateFriendButton() {
		let shouldDisplay = true;
		if (Dependency<ProtectedFriendsController>().GetFriendById(this.user.uid) !== undefined) {
			shouldDisplay = false;
		} else if (Dependency<ProtectedFriendsController>().HasOutgoingFriendRequest(this.user.uid)) {
			shouldDisplay = false;
		}
		this.addFriendContainer.SetActive(true);

		this.addFriendContainer.SetActive(shouldDisplay);

		if (!shouldDisplay) {
			// Clean add friend button
			this.addFriendButtonBin?.Clean();
			this.addFriendButtonBin = undefined;
		} else if (!this.addFriendButtonBin) {
			// Setup add friend button
			this.addFriendButtonBin = new Bin();
			this.bin.Add(this.addFriendButtonBin);

			this.addFriendButtonBin.AddEngineEventConnection(
				CanvasAPI.OnClickEvent(this.addFriendButton, () => {
					Dependency<ProtectedFriendsController>().SendFriendRequest(this.user.username);
				}),
			);
		}
	}

	public async UpdatePicture() {
		if (this.user) {
			const profileTexture = await Airship.Players.GetProfilePictureAsync(this.user.uid);
			if (profileTexture) {
				this.profileImage.texture = profileTexture;
			}
		}
	}

	override OnDestroy(): void {
		this.bin.Clean();
	}
}
