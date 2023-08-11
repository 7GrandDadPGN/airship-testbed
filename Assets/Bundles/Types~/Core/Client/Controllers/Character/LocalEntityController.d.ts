import { OnStart } from "@easy-games/flamework-core";
import { DataStreamItems } from "Shared/Util/DataStreamTypes";
import { CameraController } from "../Camera/CameraController";
import { ClientSettingsController } from "../ClientSettings/ClientSettingsController";
import { InventoryController } from "../Inventory/InventoryController";
import { EntityInput } from "./EntityInput";
export declare class LocalEntityController implements OnStart {
    private readonly cameraController;
    private readonly clientSettings;
    private readonly inventoryController;
    private firstPerson;
    private lookBackwards;
    private fps?;
    /** Fires whenever the user changes their first-person state. */
    readonly FirstPersonChanged: any;
    /** Fires whenever the user requests to look (or stop looking) backwards. */
    readonly LookBackwardsChanged: any;
    private customDataQueue;
    private entityDriver;
    private entityInput;
    private prevState;
    private currentState;
    private humanoidCameraMode;
    constructor(cameraController: CameraController, clientSettings: ClientSettingsController, inventoryController: InventoryController);
    /** Returns `true` if the player is in first-person mode. */
    IsFirstPerson(): boolean;
    /** Observes the current first-person state. */
    ObserveFirstPerson(observer: (isFirstPerson: boolean) => CleanupFunc): () => void;
    /** Observes whether or not the player wants to look backwards. */
    ObserveLookBackwards(observer: (lookBackwards: boolean) => CleanupFunc): () => void;
    /** Add custom data to the move data command stream. */
    AddToMoveData<K extends keyof DataStreamItems, T extends DataStreamItems[K]>(key: K, value: T): void;
    private TakeScreenshot;
    OnStart(): void;
    UpdateFov(): void;
    private SetLookBackwards;
    ToggleFirstPerson(): void;
    SetFirstPerson(value: boolean): void;
    GetEntityInput(): EntityInput | undefined;
}
