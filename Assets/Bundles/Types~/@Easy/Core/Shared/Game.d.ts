import { CoreContext } from "./CoreClientContext";
import { Player } from "./Player/Player";
import { Signal } from "./Util/Signal";
export declare class Game {
    /**
     * The local client's player.
     *
     * On the server this is undefined.
     *
     * There is a brief moment on client startup when localPlayer is undefined.
     */
    static localPlayer: Player;
    static localPlayerLoaded: boolean;
    static onLocalPlayerLoaded: Signal<void>;
    static WaitForLocalPlayerLoaded(): void;
    static BroadcastMessage(message: string): void;
    static context: CoreContext;
    /**
     * Empty string when in editor.
     */
    static serverId: string;
    /**
     * While in editor, this will reflect whatever is defined in `Assets/GameConfig.asset`
     */
    static gameId: string;
    /**
     * Empty string when in editor.
     */
    static organizationId: string;
    static startingScene: string;
}
