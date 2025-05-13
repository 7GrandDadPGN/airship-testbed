import { Dependency, Service } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { AirshipUrl } from "@Easy/Core/Shared/Util/AirshipUrl";
import { ShutdownService } from "../../Shutdown/ShutdownService";
import { GameCoordinatorClient } from "@Easy/Core/Shared/TypePackages/game-coordinator-types";
import { UnityMakeRequest } from "@Easy/Core/Shared/TypePackages/UnityMakeRequest";
import { AirshipServerAccessMode, AirshipServer, AirshipServerConfig } from "@Easy/Core/Shared/Airship/Types/AirshipServerManager";

export const enum ServerManagerServiceBridgeTopics {
	CreateServer = "ServerManagerService:CreateServer",
	GetServers = "ServerManagerService:GetServers",
	ShutdownServer = "ServerManagerService:ShutdownServer",
	ListServer = "ServerManagerService:ListServer",
	DelistServer = "ServerManagerService:UnlistServer",
	GetServerList = "ServerManagerService:GetServerList",
	SetAccessMode = "ServerManagerService:SetAccessMode",
	GetGameConfig = "ServerManagerService:GetGameConfig",
	GetAllowedPlayers = "ServerManagerService:GetAllowedPlayers",
	AddAllowedPlayer = "ServerManagerService:AddAllowedPlayer",
	RemoveAllowedPlayer = "ServerManagerService:RemoveAllowedPlayer",
	HasAllowedPlayer = "ServerManagerService:HasAllowedPlayer",
	GetTags = "ServerManagerService:GetTags",
	HasTag = "ServerManagerService:HasTag",
	AddTag = "ServerManagerService:AddTag",
	RemoveTag = "ServerManagerService:RemoveTag",
	GetRegions = "ServerManagerService:GetRegions",
}

export type ServerBridgeApiCreateServer = (config?: AirshipServerConfig) => AirshipServer;
export type ServerBridgeApiGetServers = (serverIds: string[]) => {
	[serverId: string]: AirshipServer | undefined;
};
export type ServerBridgeApiShutdownServer = () => void;
export type ServerBridgeApiListServer = (config?: { name?: string; description?: string }) => boolean;
export type ServerBridgeApiDelistServer = () => boolean;
export type ServerBridgeApiGetServerList = (page?: number) => { entries: AirshipServer[] };
export type ServerBridgeApiSetAccessMode = (mode: AirshipServerAccessMode) => boolean;
export type ServerBridgeApiGetGameConfig<T> = () => T | undefined;
export type ServerBridgeApiGetAllowedPlayers = () => Readonly<string[]>;
export type ServerBridgeApiHasAllowedPlayer = (userId: string) => boolean;
export type ServerBridgeApiAddAllowedPlayer = (userId: string) => boolean;
export type ServerBridgeApiRemoveAllowedPlayer = (userId: string) => boolean;
export type ServerBridgeApiGetTags = () => Readonly<string[]>;
export type ServerBridgeApiHasTag = (tag: string) => boolean;
export type ServerBridgeApiAddTag = (tag: string) => boolean;
export type ServerBridgeApiRemoveTag = (tag: string) => boolean;
export type ServerBridgeApiGetRegions = () => { regionIds: string[] };

const ALLOWED_PLAYERS_LIST_KEY = "allowedPlayers";
const TAGS_LIST_KEY = "tags";

const client = new GameCoordinatorClient(UnityMakeRequest(AirshipUrl.GameCoordinator));

@Service({})
export class ProtectedServerManagerService {
	constructor() {
		if (!Game.IsServer()) return;

		contextbridge.callback<ServerBridgeApiCreateServer>(
			ServerManagerServiceBridgeTopics.CreateServer,
			(_, config) => {
				return this.CreateServer(config).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiGetServers>(
			ServerManagerServiceBridgeTopics.GetServers,
			(_, serverIds) => {
				return this.GetServers(serverIds).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiShutdownServer>(ServerManagerServiceBridgeTopics.ShutdownServer, () => {
			Dependency<ShutdownService>().Shutdown();
			return { success: true, data: undefined };
		});

		contextbridge.callback<ServerBridgeApiListServer>(ServerManagerServiceBridgeTopics.ListServer, (_, config) => {
			return this.ListServer(config).expect();
		});

		contextbridge.callback<ServerBridgeApiDelistServer>(ServerManagerServiceBridgeTopics.DelistServer, (_) => {
			return this.DelistServer().expect();
		});

		contextbridge.callback<ServerBridgeApiGetServerList>(ServerManagerServiceBridgeTopics.GetServerList, (_) => {
			return this.GetServerList().expect();
		});

		contextbridge.callback<ServerBridgeApiSetAccessMode>(
			ServerManagerServiceBridgeTopics.SetAccessMode,
			(_, mode) => {
				return this.SetAccessMode(mode).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiGetGameConfig<unknown>>(
			ServerManagerServiceBridgeTopics.GetGameConfig,
			(_) => {
				return this.GetGameConfig();
			},
		);

		contextbridge.callback<ServerBridgeApiGetAllowedPlayers>(
			ServerManagerServiceBridgeTopics.GetAllowedPlayers,
			(_) => {
				return this.GetAllowedPlayers().expect();
			},
		);

		contextbridge.callback<ServerBridgeApiHasAllowedPlayer>(
			ServerManagerServiceBridgeTopics.HasAllowedPlayer,
			(_, userId) => {
				return this.HasAllowedPlayer(userId).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiAddAllowedPlayer>(
			ServerManagerServiceBridgeTopics.AddAllowedPlayer,
			(_, userId) => {
				return this.AddAllowedPlayer(userId).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiRemoveAllowedPlayer>(
			ServerManagerServiceBridgeTopics.RemoveAllowedPlayer,
			(_, userId) => {
				return this.RemoveAllowedPlayer(userId).expect();
			},
		);

		contextbridge.callback<ServerBridgeApiGetTags>(ServerManagerServiceBridgeTopics.GetTags, (_) => {
			return this.GetTags().expect();
		});

		contextbridge.callback<ServerBridgeApiAddTag>(ServerManagerServiceBridgeTopics.HasTag, (_, tag) => {
			return this.HasTag(tag).expect();
		});

		contextbridge.callback<ServerBridgeApiAddTag>(ServerManagerServiceBridgeTopics.AddTag, (_, tag) => {
			return this.AddTag(tag).expect();
		});

		contextbridge.callback<ServerBridgeApiRemoveTag>(ServerManagerServiceBridgeTopics.RemoveTag, (_, tag) => {
			return this.RemoveTag(tag).expect();
		});
	}

	public async CreateServer(config?: AirshipServerConfig): Promise<ReturnType<ServerBridgeApiCreateServer>> {
		const result = await client.servers.createServer({
			sceneId: config?.sceneId,
			region: config?.region,
			accessMode: config?.accessMode,
			allowedUids: config?.allowedUserIds,
			maxPlayers: config?.maxPlayers,
			tags: config?.tags,
			gameConfig: config?.gameConfig,
			fleet: config?.fleet,
		});
		return result;
	}

	public async GetServers(serverIds: string[]): Promise<ReturnType<ServerBridgeApiGetServers>> {
		if (serverIds.size() === 0) {
			return {};
		}

		return await client.servers.getServers({ serverIds });
	}

	public async ListServer(config?: {
		name?: string;
		description?: string;
	}): Promise<ReturnType<ServerBridgeApiListServer>> {
		if (config?.name) await AgonesCore.Agones.SetAnnotation("ServerListName", config.name);
		if (config?.description) await AgonesCore.Agones.SetAnnotation("ServerListDesc", config.description);

		const res = await AgonesCore.Agones.SetAnnotation("ServerListActive", "true");
		return res;
	}

	public async DelistServer(): Promise<ReturnType<ServerBridgeApiDelistServer>> {
		const res = await AgonesCore.Agones.SetAnnotation("ServerListActive", "false");
		return res;
	}

	public async GetServerList(page: number = 0): Promise<ReturnType<ServerBridgeApiGetServerList>> {
		return await client.servers.getServerList({ params: { gameId: Game.gameId }, query: { page } });
	}

	public async SetAccessMode(mode: AirshipServerAccessMode): Promise<ReturnType<ServerBridgeApiSetAccessMode>> {
		const res = await AgonesCore.Agones.SetLabel("AccessMode", mode);
		return res;
	}

	public GetGameConfig<T>(): ReturnType<ServerBridgeApiGetGameConfig<T>> {
		const serverBootstrap = GameObject.Find("ServerBootstrap").GetComponent<ServerBootstrap>()!;
		const gs = serverBootstrap.GetGameServer();
		try {
			const gameConfigString = gs?.ObjectMeta.Annotations.Get("GameConfig");
			if (!gameConfigString) return undefined;

			const gameConfig = json.decode(gameConfigString);
			return gameConfig as T;
		} catch (err) {
			return undefined;
		}
	}

	public async GetAllowedPlayers(): Promise<ReturnType<ServerBridgeApiGetAllowedPlayers>> {
		return await AgonesCore.Agones.GetListValues(ALLOWED_PLAYERS_LIST_KEY);
	}

	public async HasAllowedPlayer(userId: string): Promise<ReturnType<ServerBridgeApiHasAllowedPlayer>> {
		return await AgonesCore.Agones.ListContains(ALLOWED_PLAYERS_LIST_KEY, userId);
	}

	public async AddAllowedPlayer(userId: string): Promise<ReturnType<ServerBridgeApiAddAllowedPlayer>> {
		return await AgonesCore.Agones.AppendListValue(ALLOWED_PLAYERS_LIST_KEY, userId);
	}

	public async RemoveAllowedPlayer(userId: string): Promise<ReturnType<ServerBridgeApiRemoveAllowedPlayer>> {
		return await AgonesCore.Agones.DeleteListValue(ALLOWED_PLAYERS_LIST_KEY, userId);
	}

	public async GetTags(): Promise<ReturnType<ServerBridgeApiGetTags>> {
		return await AgonesCore.Agones.GetListValues(TAGS_LIST_KEY);
	}

	public async HasTag(tag: string): Promise<ReturnType<ServerBridgeApiHasTag>> {
		return await AgonesCore.Agones.ListContains(TAGS_LIST_KEY, tag);
	}

	public async AddTag(tag: string): Promise<ReturnType<ServerBridgeApiAddTag>> {
		return await AgonesCore.Agones.AppendListValue(TAGS_LIST_KEY, tag);
	}

	public async RemoveTag(tag: string): Promise<ReturnType<ServerBridgeApiRemoveTag>> {
		return await AgonesCore.Agones.DeleteListValue(TAGS_LIST_KEY, tag);
	}

	public async GetRegions() {
		return await client.servers.getRegionIds();
	}
}
