import { Controller, OnStart } from "@easy-games/flamework-core";
import { CoreUI } from "Shared/UI/CoreUI";
import { AppManager } from "Shared/Util/AppManager";
import { CanvasAPI } from "Shared/Util/CanvasAPI";
import { Task } from "Shared/Util/Task";

@Controller({})
export class EscapeMenuController implements OnStart {
	public canvas: Canvas;
	private canvasGroup: CanvasGroup;
	private wrapperRect: RectTransform;
	private closing = false;
	public refs: GameObjectReferences;

	constructor() {
		const go = GameObject.Find("CoreUI/EscapeMenu");
		this.canvas = go.GetComponent<Canvas>();
		this.canvas.enabled = false;
		this.canvasGroup = go.GetComponent<CanvasGroup>();

		this.refs = go.GetComponent<GameObjectReferences>();
		this.wrapperRect = this.refs.GetValue("UI", "Wrapper").GetComponent<RectTransform>();
		const closeButton = this.refs.GetValue("UI", "CloseButton");
		CoreUI.SetupButton(closeButton);
		CanvasAPI.OnClickEvent(closeButton, () => {
			AppManager.Close({
				noCloseSound: true,
			});
		});
	}

	OnStart(): void {
		// const keyboard = new Keyboard();
		// keyboard.OnKeyDown(
		// 	KeyCode.Escape,
		// 	(event) => {
		// 		this.Open();
		// 	},
		// 	SignalPriority.LOW,
		// );
		// const leaveButton = this.refs.GetValue("UI", "LeaveButton");
		// CoreUI.SetupButton(leaveButton);
		// CanvasAPI.OnClickEvent(leaveButton, () => {
		// 	this.Disconnect();
		// });
	}

	public Open(): void {
		if (AppManager.IsOpen()) return;
		if (this.closing) return;

		const duration = 0.08;
		this.wrapperRect.localScale = new Vector3(1.1, 1.1, 1.1);
		this.wrapperRect.TweenLocalScale(new Vector3(1, 1, 1), duration);
		this.canvasGroup.alpha = 0;
		this.canvasGroup.TweenCanvasGroupAlpha(1, duration);
		this.canvas.enabled = true;
		AppManager.OpenCustom(() => {
			this.closing = true;
			this.canvasGroup.TweenCanvasGroupAlpha(0, duration);
			Task.Delay(duration, () => {
				this.canvas.enabled = false;
				this.closing = false;
			});
		});
	}

	public Disconnect(): void {
		const clientNetworkConnector = GameObject.Find("Network").GetComponent<ClientNetworkConnector>();
		clientNetworkConnector.Disconnect();
		SceneManager.LoadScene("MainMenu", LoadSceneMode.Single);
	}
}
