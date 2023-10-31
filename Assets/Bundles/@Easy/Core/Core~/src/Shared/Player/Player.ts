import { Dependency } from "@easy-games/flamework-core";
import { ChatController } from "Client/Controllers/Chat/ChatController";
import { PlayerController } from "Client/Controllers/Player/PlayerController";
import { PlayerService } from "Server/Services/Player/PlayerService";
import { CoreNetwork } from "Shared/CoreNetwork";
import { CharacterEntity } from "Shared/Entity/Character/CharacterEntity";
import { AirshipUrl } from "Shared/Util/AirshipUrl";
import { encode } from "Shared/json";
import { Team } from "../Team/Team";
import { Bin } from "../Util/Bin";
import { RunUtil } from "../Util/RunUtil";
import { Signal } from "../Util/Signal";

export interface PlayerDto {
	nobId: number;
	clientId: number;
	userId: string;
	username: string;
	usernameTag: string;
	teamId: string | undefined;
}

export class Player {
	/**
	 * The player controls this entity.
	 */
	public Character: CharacterEntity | undefined;
	/** Fired when the player's character changes. */
	public readonly CharacterChanged = new Signal<CharacterEntity | undefined>();
	/**
	 * Fired when the player disconnects from the server.
	 * Connections will automatically be disconnected when the player leaves.
	 */
	public readonly OnLeave = new Signal<void>();

	private team: Team | undefined;
	public readonly OnChangeTeam = new Signal<[team: Team | undefined, oldTeam: Team | undefined]>();

	public OnUsernameChanged = new Signal<[username: string, tag: string]>();

	private bin = new Bin();
	private connected = true;

	constructor(
		/**
		 * The GameObject representing the player.
		 */
		public readonly nob: NetworkObject,

		/**
		 * Unique network ID for the player in the given server. This ID
		 * is typically given to network requests as a way to identify the
		 * player to/from the server.
		 *
		 * This is not a unique identifier for the player outside of the
		 * server. For a completely unique ID, use `BWPlayer.clientId`
		 * instead.
		 */
		public readonly clientId: number,

		/**
		 * The player's unique ID. This is unique and unchanging per player.
		 *
		 * This should _not_ be used in network requests to identify the
		 * player. Use `clientId` for network requests.
		 */
		public userId: string,

		/**
		 * The player's username. Non-unique, unless combined with `usernameTag`.
		 */
		public username: string,

		/**
		 * The player's username tag. Append this value onto `username` for a
		 * unique username.
		 * ```ts
		 * const uniqueName = `${player.username}#${player.usernameTag}`;
		 * ```
		 */
		public usernameTag: string,
	) {}

	public SetTeam(team: Team): void {
		const oldTeam = this.team;
		this.team = team;
		this.OnChangeTeam.Fire(team, oldTeam);
	}

	public GetTeam(): Team | undefined {
		return this.team;
	}

	public UpdateUsername(username: string, tag: string): void {
		this.username = username;
		this.usernameTag = tag;
		this.OnUsernameChanged.Fire(username, tag);
	}

	public SendMessage(message: string): void {
		if (RunUtil.IsServer()) {
			CoreNetwork.ServerToClient.ChatMessage.Server.FireClient(this.clientId, message);
		} else {
			Dependency<ChatController>().RenderChatMessage(message);
		}
	}

	/** Is player friends with the local player? */
	public IsFriend(): boolean {
		return false;
	}

	public IsBot(): boolean {
		return this.clientId < 0;
	}

	public Encode(): PlayerDto {
		return {
			nobId: this.nob.ObjectId,
			clientId: this.clientId,
			userId: this.userId,
			username: this.username,
			usernameTag: this.usernameTag,
			teamId: this.team?.id,
		};
	}

	public SetCharacter(entity: CharacterEntity | undefined): void {
		this.Character = entity;
		this.CharacterChanged.Fire(entity);
	}

	public ObserveCharacter(observer: (entity: CharacterEntity | undefined) => CleanupFunc): Bin {
		const bin = new Bin();
		let cleanup = observer(this.Character);

		bin.Add(
			this.CharacterChanged.Connect((newCharacter) => {
				cleanup?.();
				cleanup = observer(newCharacter);
			}),
		);

		this.bin.Add(bin);
		return bin;
	}

	/**
	 * Is the player connected to the server?
	 */
	public IsConnected(): boolean {
		return this.connected;
	}

	public Destroy(): void {
		this.connected = false;
		this.bin.Clean();
		this.OnLeave.Fire();
		this.OnLeave.DisconnectAll();
	}

	/**
	 * **Server Only**
	 */
	public TransferToServer(serverId: string, serverTransferData?: unknown, clientTransferData?: unknown) {
		if (RunUtil.IsClient()) {
			print("Player.TeleportToServer can only be called on the server.");
			return;
		}

		const jwt = GameObject.Find("ServerBootstrap")?.GetComponent<ServerBootstrap>().airshipJWT;
		const res = HttpManager.PostAsync(
			AirshipUrl.GameCoordinatorSocket + "/transfers/transfer",
			encode({
				uid: this.userId,
				serverId,
				serverTransferData,
				clientTransferData,
			}),
			`Authorization=Bearer ${jwt}`,
		);
	}

	public static FindByClientId(clientId: number): Player | undefined {
		if (RunUtil.IsServer()) {
			return Dependency<PlayerService>().GetPlayerFromClientId(clientId);
		} else {
			return Dependency<PlayerController>().GetPlayerFromClientId(clientId);
		}
	}
}
