import { Airship } from "../Airship";
import { Asset } from "../Asset";
import { EmoteStartSignal } from "../Character/Signal/EmoteStartSignal";
import { CoreNetwork } from "../CoreNetwork";
import { OnStart, Singleton } from "../Flamework";
import { Game } from "../Game";
import { Bin } from "../Util/Bin";
import { SignalPriority } from "../Util/Signal";
import { EmoteDefinition } from "./EmoteDefinition";
import { EmoteId } from "./EmoteId";
import { InternalEmoteDefinitions } from "./InternalEmoteDef";

@Singleton({})
export default class AirshipEmoteSingleton implements OnStart {
	public OnStart() {
		if (Game.IsServer()) this.StartServer();
		if (Game.IsClient()) this.StartClient();
	}

	private StartServer(): void {
		CoreNetwork.ClientToServer.Character.EmoteRequest.server.OnClientEvent((player, emoteId) => {
			const emoteDef = InternalEmoteDefinitions[emoteId as EmoteId] as EmoteDefinition | undefined;
			if (!emoteDef) return;
			if (!player.character) return;
			if (player.character.isEmoting) return;

			const startSignal = player.character.onEmoteStart.Fire(new EmoteStartSignal(emoteId));
			if (startSignal.IsCancelled()) return;

			CoreNetwork.ServerToClient.Character.EmoteStart.server.FireAllClients(player.character.id, emoteId);
		});
	}

	private StartClient(): void {
		CoreNetwork.ServerToClient.Character.EmoteStart.client.OnServerEvent((characterId, emoteId) => {
			const character = Airship.Characters.FindById(characterId);
			if (!character) return;
			if (!character.IsAlive()) return;

			const emoteDef = InternalEmoteDefinitions[emoteId as EmoteId] as EmoteDefinition | undefined;
			if (!emoteDef) return;

			if (character.isEmoting) {
				character.onEmoteEnd.Fire();
			}

			if (!Game.IsHosting()) {
				const startSignal = character.onEmoteStart.Fire(new EmoteStartSignal(emoteId));
				if (startSignal.IsCancelled()) return;
			}

			const anim = Asset.LoadAsset<AnimationClip>(emoteDef.anim);
			character.animationHelper.PlayAnimation(
				anim,
				CharacterAnimationLayer.OVERRIDE_3,
				emoteDef.fadeInTime ?? 0.1,
			);

			const length = anim.length;
			const emoteBin = new Bin();
			let alive = true;
			emoteBin.Add(
				character.onEmoteEnd.ConnectWithPriority(SignalPriority.HIGHEST, () => {
					alive = false;
					emoteBin.Clean();
				}),
			);
			task.delay(length, () => {
				if (alive) {
					emoteBin.Clean();
					character.onEmoteEnd.Fire();
				}
			});
		});
	}
}
