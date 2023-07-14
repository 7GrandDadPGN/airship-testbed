import { Cancellable } from "Shared/Util/Cancellable";

export class KeySignal extends Cancellable {
	constructor(public readonly KeyCode: KeyCode) {
		super();
	}
}
