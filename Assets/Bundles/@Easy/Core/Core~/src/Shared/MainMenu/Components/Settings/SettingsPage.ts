import { Dependency } from "@Easy/Core/Shared/Flamework";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { MainMenuSingleton } from "../../Singletons/MainMenuSingleton";

export default class SettingsPage extends AirshipBehaviour {
	public sidebar!: RectTransform;
	public tabs!: RectTransform;

	public mobilePages!: RectTransform[];

	private bin = new Bin();

	public OnEnable(): void {
		const rect = this.gameObject.transform as RectTransform;
		const mainMenu = Dependency<MainMenuSingleton>();
		this.bin.Add(
			mainMenu.ObserveScreenSizeType((size) => {
				if (size === "sm") {
					print("sm tabs");
					this.sidebar.gameObject.SetActive(false);
					this.tabs.offsetMax = new Vector2(-10, this.tabs.offsetMax.y);
					this.tabs.offsetMin = new Vector2(10, 0);
					rect.offsetMax = new Vector2(rect.offsetMax.x, 50);

					for (let page of this.mobilePages) {
						page.gameObject.SetActive(true);
					}

					const navbarDisc = mainMenu.navbarModifier.Add({ hidden: true });
					this.bin.Add(navbarDisc);
					return () => {
						navbarDisc();
					};
				} else {
					rect.offsetMax = new Vector2(rect.offsetMax.x, 0);
					this.sidebar.gameObject.SetActive(true);
					this.tabs.offsetMax = new Vector2(-41, -49);
					this.tabs.offsetMin = new Vector2(270, -mainMenu.screenSize.y);
				}
			}),
		);
	}

	public OnDisable(): void {
		this.bin.Clean();
	}
}
