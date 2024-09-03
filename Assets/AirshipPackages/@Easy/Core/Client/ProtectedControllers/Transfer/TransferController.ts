import { AirshipGameServer } from "@Easy/Core/Shared/Airship/Types/Outputs/AirshipTransfers";
import { Controller, Dependency } from "@Easy/Core/Shared/Flamework";
import { Result } from "@Easy/Core/Shared/Types/Result";
import { AirshipUrl } from "@Easy/Core/Shared/Util/AirshipUrl";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { EncodeJSON } from "@Easy/Core/Shared/json";
import { MainMenuPartyController } from "../Social/MainMenuPartyController";
import { SocketController } from "../Socket/SocketController";

@Controller({})
export class TransferController {
	constructor(private readonly socketController: SocketController) {}

	protected OnStart(): void {
		this.socketController.On<{
			gameServer: AirshipGameServer;
			gameId: string;
			gameVersion: number;
			requestTime: number;
			transferData?: unknown;
		}>("game-coordinator/server-transfer", (data) => {
			print("Received transfer event: " + inspect(data));
			TransferManager.Instance.ConnectToServer(data.gameServer.ip, data.gameServer.port);

			try {
				// avoiding version bump
				CrossSceneState.ServerTransferData.gameId = data.gameId;
			} catch (err) {}
		});
	}

	/**
	 * Submits a request to transfer to the provided game id. The client can optionally request to transfer
	 * to a specific server of the given game by providing the perferred server id. It is possible that the
	 * client will be transferred to a different server if the perferred server is full or was not allocated
	 * with the default scene.
	 * @param gameId Game id to join.
	 * @param preferredServerId Specific ServerID to teleport to. If not included, the backend will select a server for you.
	 */
	public async TransferToGameAsync(
		gameId: string,
		preferredServerId?: string,
	): Promise<Result<undefined, undefined>> {
		let isPartyLeader = Dependency<MainMenuPartyController>().IsPartyLeader();
		const res = InternalHttpManager.PostAsync(
			AirshipUrl.GameCoordinator + "/transfers/transfer/self",
			EncodeJSON({
				gameId: gameId,
				preferredServerId,
				withParty: isPartyLeader,
			}),
		);

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to complete transfer request. Status Code:  ${res.statusCode}.\n`, res.error);
			return {
				success: false,
				error: undefined,
			};
		}

		return {
			success: true,
			data: undefined,
		};
	}

	/**
	 * Submits a request to transfer to the current party leader. If the party leader is not in a game,
	 * or the client is not in a party, this function will have no effect.
	 */
	public async TransferToPartyLeader(): Promise<Result<undefined, undefined>> {
		const res = InternalHttpManager.PostAsync(AirshipUrl.GameCoordinator + "/transfers/transfer/self/party", "");

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to complete transfer request. Status Code:  ${res.statusCode}.\n`, res.error);
			return {
				success: false,
				error: undefined,
			};
		}

		return {
			success: true,
			data: undefined,
		};
	}

	/**
	 * Submits a request to transfer party members to the party leader.
	 * Only the party leader can send this request.
	 */
	public async TransferPartyMembersToLeader(): Promise<boolean> {
		const res = InternalHttpManager.PostAsync(AirshipUrl.GameCoordinator + "/transfers/transfer/party", "");

		if (!res.success || res.statusCode > 299) {
			warn(`Unable to complete transfer request. Status Code:  ${res.statusCode}.\n`, res.error);
			return false;
		}

		return true;
	}
}
