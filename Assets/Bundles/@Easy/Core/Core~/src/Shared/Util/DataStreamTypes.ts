import { HeldItemState } from "Shared/Item/HeldItems/HeldItemState";
import { ItemType } from "Shared/Item/ItemType";

/** Key/value type list. The key is the name of the custom data, followed by the value type. */
export type DataStreamItems = {
	PlaceBlock: {
		pos: Vector3;
		itemType: ItemType;
	};
	HitBlock: Vector3;
	TillBlock: Vector3;
	HeldItemState: HeldItemStateInfo;
};

interface HeldItemStateInfo {
	state: HeldItemState;
	entityId: number;
}
