import { OnStart, Service } from "@easy-games/flamework-core";

@Service({})
export class DisableServerUIService implements OnStart {
	constructor() {}

	OnStart(): void {
		// Disables all UI
		this.DisableChildren(GameObject.Find("UI").transform);
	}

	private DisableChildren(transform: Transform): void {
		for (let i = 0; i < transform.childCount; i++) {
			const child = transform.GetChild(i);
			const canvas = child.gameObject.GetComponentIfExists<Canvas>("Canvas");
			if (canvas) {
				canvas.enabled = false;
			}
		}
	}
}
print("outside DisableServerUIService");
