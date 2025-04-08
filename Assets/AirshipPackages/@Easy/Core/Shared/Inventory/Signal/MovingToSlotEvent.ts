import { Airship } from "../../Airship";
import { Cancellable } from "../../Util/Cancellable";
import Inventory from "../Inventory";
import { ItemStack } from "../ItemStack";

export class MovingToSlotEvent extends Cancellable {
	public amount: number;
	public readonly fromItem: ItemStack | undefined;

	/**
	 * Allows merging of stacks if they have the same `itemType`
	 *
	 * @default true
	 */
	public allowMerging = true;

	public constructor(
		/**
		 * The inventory of the source ItemStack
		 */
		public readonly fromInventory: Inventory,
		/**
		 * The index of the source ItemStack
		 */
		public readonly fromSlot: number,
		/**
		 * The inventory of the destination ItemStack
		 */
		public readonly toInventory: Inventory,
		/**
		 * The index of the destination ItemStack
		 */
		public readonly toSlot: number,
		/**
		 * The amount that will be transferred
		 */
		amount?: number,
	) {
		super();
	
		const fromStack = fromInventory.GetItem(fromSlot);
		amount ??= fromStack?.amount ?? 0;
		
		this.amount = amount;
		this.fromItem = fromStack;
	}

	public GetSourceItemStack() {
		return this.fromItem;
	}

	public GetTargetItemStack() {
		return this.toInventory.GetItem(this.toSlot);
	}
}
