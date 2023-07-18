import { CoreSignals } from "./CoreSignals";
import { EasyCore } from "./EasyCore";
import { UserAPI } from "./API/UserAPI";
import { UpdateUserDto } from "./SocketIOMessages/UpdateUserDto";
import { FriendAPI } from "./API/FriendAPI";
import { encode } from "./Lib/json";
import { SetInterval } from "./Util/Timer";

print(`CoreShared.Main.ts()`);

CoreSignals.CoreInitialized.Connect((signal) => {
	print(`Main.ts CoreSignals.CoreInitialized! signal.idToken: ${signal.idToken}`);
	UserAPI.initAsync();
});

CoreSignals.UserServiceInitialized.Connect(async () => {
	const curUser = UserAPI.getCurrentUser();
	print(`Main.ts CoreSignals.UserServiceInitialized! curUser?.username: ${curUser?.username}`);
	if (curUser) {
		const curUser2 = await UserAPI.getUserAsync(curUser?.discriminatedUsername);
		print(`Main.ts CoreSignals.UserServiceInitialized! curUser2?.username: ${curUser2?.username}`);
		if (curUser2?.username) {
			await UserAPI.updateCurrentUserAsync(new UpdateUserDto(curUser2?.username.sub(0, -2)));
		}
	}

	const friends = await FriendAPI.getFriendsAsync();
	print(`Main.ts CoreSignals.UserServiceInitialized! friends: ${encode(friends)}`);
	if (curUser?.uid) {
		const friendsOfUser = await FriendAPI.getStatusWithOtherUserAsync("daqTObdnLVe7TEkkxiKfosDecz12");
		print(`Main.ts CoreSignals.UserServiceInitialized! friendsOfUser: ${encode(friendsOfUser)}`);

		if (!friendsOfUser.isFriends) {
			const requestResult = await FriendAPI.requestFriendshipAsync("BEDBOUNCER89336#0002");

			print(`Main.ts CoreSignals.UserServiceInitialized! requestResult: ${requestResult}`);
		}
	}
});

CoreSignals.GameCoordinatorMessage.Connect((signal) => {
	print(
		`Main.ts CoreSignals.GameCoordinatorMessage! signal.messageName: ${signal.messageName}, signal.jsonMessage: ${signal.jsonMessage}`,
	);
});

CoreSignals.UserServiceInitialized.Connect(() => {
	SetInterval(
		3,
		async () => {
			print(`SetInterval() friends: ${encode(await FriendAPI.getFriendsAsync())}`);
			print(`SetInterval() friendRequests: ${encode(await FriendAPI.getFriendRequestsAsync())}`);
		},
		true,
	);
});

if (RunCore.IsClient()) {
	//EasyCore.initAsync();
}
