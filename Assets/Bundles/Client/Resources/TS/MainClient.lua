-- Compiled with unity-ts v2.1.0-75
local Flamework = require("Shared/rbxts_include/node_modules/@easy-games/flamework-core/out/init").Flamework
local _Timer = require("Shared/TS/Util/Timer")
local OnFixedUpdate = _Timer.OnFixedUpdate
local OnLateUpdate = _Timer.OnLateUpdate
local OnTick = _Timer.OnTick
local OnUpdate = _Timer.OnUpdate
local BedWars = require("Shared/TS/BedWars/BedWars").BedWars
local Network = require("Shared/TS/Network").Network
local InitNet = require("Shared/TS/Network/NetworkAPI").InitNet
local TimeUtil = require("Shared/TS/Util/TimeUtil").TimeUtil
local SetupWorld = require("Shared/TS/VoxelWorld/SetupWorld").SetupWorld
local function LoadFlamework()
	Flamework.addPath("assets/game/bedwars/bundles/client/resources/ts/controllers/global", "^.*controller.lua$")
	if BedWars:IsMatchServer() then
		Flamework.addPath("assets/game/bedwars/bundles/client/resources/ts/controllers/match", "^.*controller.lua$")
	elseif BedWars:IsLobbyServer() then
		Flamework.addPath("assets/game/bedwars/bundles/client/resources/ts/controllers/lobby", "^.*controller.lua$")
	end
	Flamework.ignite()
	print("sending ready packet!")
	Network.ClientToServer.Ready.Client:FireServer()
end
local function LoadClient()
	InitNet()
	SetupWorld()
	LoadFlamework()
end
local function SetupClient()
	-- Drive timer:
	gameObject:OnUpdate(function()
		OnUpdate:Fire(TimeUtil:GetDeltaTime())
	end)
	gameObject:OnLateUpdate(function()
		OnLateUpdate:Fire(TimeUtil:GetDeltaTime())
	end)
	gameObject:OnFixedUpdate(function()
		OnFixedUpdate:Fire(TimeUtil:GetFixedDeltaTime())
	end)
	InstanceFinder.TimeManager:OnOnTick(function()
		OnTick:Fire()
	end)
	-- const sceneListener = GameObject.Find("ClientSceneListener").GetComponent<ClientSceneListener>();
	-- if (sceneListener.IsGameSceneLoaded) {
	-- LoadClient();
	-- } else {
	-- sceneListener.OnSceneLoadedEvent((sceneName) => {
	-- print("loading client...");
	-- wait();
	-- LoadClient();
	-- });
	-- }
	print("Loading client...")
	LoadClient()
	print("Finished loading client!")
end
return {
	SetupClient = SetupClient,
}
-- ----------------------------------
-- ----------------------------------
