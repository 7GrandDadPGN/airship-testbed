import { Controller, OnStart } from "@easy-games/flamework-core";
import { ClientSignals } from "Client/ClientSignals";
import { PlayerController } from "Imports/Core/Client/Controllers/Player/PlayerController";
import { TeamController } from "Imports/Core/Client/Controllers/Team/TeamController";
import { CoreClientSignals } from "Imports/Core/Client/CoreClientSignals";
import { Entity } from "Imports/Core/Shared/Entity/Entity";
import { Game } from "Imports/Core/Shared/Game";
import { Player } from "Imports/Core/Shared/Player/Player";
import { Team } from "Imports/Core/Shared/Team/Team";
import { SetUtil } from "Imports/Core/Shared/Util/SetUtil";
import { Network } from "Shared/Network";

@Controller({})
export class BWController implements OnStart {
	/** Set of eliminated players. */
	private eliminatedPlayers = new Set<Player>();

	constructor(private readonly teamController: TeamController, private readonly playerController: PlayerController) {}

	OnStart(): void {
		/* Listen for player eliminated. */
		Network.ServerToClient.PlayerEliminated.Client.OnServerEvent((clientId: number) => {
			const player = this.playerController.GetPlayerFromClientId(clientId);
			if (!player) return;
			this.eliminatedPlayers.add(player);
			ClientSignals.PlayerEliminated.Fire({ player });
		});
		/* Listen for match end. */
		Network.ServerToClient.MatchEnded.Client.OnServerEvent((winningTeamId?: string) => {
			if (winningTeamId) this.ShowWinscreen(winningTeamId);
		});

		/* Listen for team assignements*/
		CoreClientSignals.PlayerChangeTeam.Connect((teamSignal) => {
			if (!teamSignal.Player.Character || teamSignal.Player.Character?.IsLocalCharacter()) {
				return;
			}
			const team = teamSignal.Player.Character?.GetTeam();
			if (team) {
				this.SetTeamColor(teamSignal.Player.Character, team);
			}
		});

		CoreClientSignals.EntitySpawn.Connect((spawnSignal) => {
			const team = spawnSignal.entity.GetTeam();
			if (team) {
				this.SetTeamColor(spawnSignal.entity, team);
			}
		});
	}

	private SetTeamColor(entity: Entity, team: Team) {
		if (entity.IsLocalCharacter() || !entity.player) {
			return;
		}
		//Show a glow to indicate friend or foe
		const sameTeam = team?.id === Game.LocalPlayer.Character?.GetTeam()?.id;
		const targetColor = sameTeam ? Color.cyan : Color.red;
		const strength = sameTeam ? 0.2 : 1;
		if (!sameTeam) {
			entity.anim.SetFresnelColor(targetColor, 5, strength);
		}
	}

	/**
	 * Checks if a player is on an eliminated team.
	 * @param player A player.
	 * @returns Whether or not `player` is eliminated.
	 */
	public IsPlayerEliminated(player: Player): boolean {
		return this.eliminatedPlayers.has(player);
	}

	/**
	 * Fetch all eliminated players.
	 * @returns A Set of all eliminated players.
	 */
	public GetEliminatedPlayers(): Player[] {
		return SetUtil.ToArray(this.eliminatedPlayers);
	}

	/**
	 * Fetch all eliminated players on a provided team.
	 * @param team A team.
	 * @returns A Set of all eliminated players on `team`.
	 */
	public GetEliminatedPlayersOnTeam(team: Team): Player[] {
		return SetUtil.ToArray(this.eliminatedPlayers).filter((player) => {
			return player.GetTeam()?.id === team.id;
		});
	}

	/**
	 * Fetch all alive players on a provided team.
	 * @param team A team.
	 * @returns A Set of all alive players on `team`.
	 */
	public GetAlivePlayersOnTeam(team: Team): Player[] {
		return this.playerController.GetPlayers().filter((player) => {
			return player.GetTeam()?.id === team.id && !this.eliminatedPlayers.has(player);
		});
	}

	/** Show winscreen for `winningTeamId`. */
	private ShowWinscreen(winningTeamId: string): void {
		const winningTeam = this.teamController.GetTeam(winningTeamId);
		if (winningTeam) {
			// const winScreenRoot = this.GetWinscreenRoot();
			// /* Show. */
			// this.winScreenDocument.enabled = true;
			// /* Update team color and win text. */
			// const teamColor = winScreenRoot.Q<VisualElement>("TeamColor");
			// UICore.SetBackgroundColor(teamColor, winningTeam.color);
			// const winText = winScreenRoot.Q<Label>("WinText");
			// winText.text = `${winningTeam.name.upper()} WINS!`;
		}
	}
}
