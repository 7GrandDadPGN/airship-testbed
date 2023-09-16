import { Controller, OnStart } from "@easy-games/flamework-core";
import { Game } from "Shared/Game";
import { Player } from "Shared/Player/Player";
import { AirshipUrl } from "Shared/Util/AirshipUrl";
import { Signal } from "Shared/Util/Signal";
import { Task } from "Shared/Util/Task";
import { decode } from "Shared/json";
import { AuthController } from "../Auth/AuthController";
import { User } from "./User";

@Controller({})
export class UserController implements OnStart {
	public localUser: User | undefined;

	public onLocalUserUpdated = new Signal<User>();

	constructor(private readonly authController: AuthController) {}

	OnStart(): void {
		this.authController.onAuthenticated.Connect(() => {
			Task.Spawn(() => {
				this.FetchLocalUser();
			});
		});

		this.authController.onSignOut.Connect(() => {
			this.localUser = undefined;
		});
	}

	public FetchLocalUser(): void {
		const res = HttpManager.GetAsync(`${AirshipUrl.UserService}/users/self`, this.authController.GetAuthHeaders());
		if (res.success) {
			const data = decode(res.data) as User;
			this.localUser = data;

			const writeUser = Game.LocalPlayer as Writable<Player>;
			writeUser.userId = data.uid;
			writeUser.username = data.username;
			writeUser.usernameTag = data.discriminator;

			this.onLocalUserUpdated.Fire(this.localUser);
			return;
		}

		// retry
		Task.Delay(1, () => {
			this.FetchLocalUser();
		});
	}
}
