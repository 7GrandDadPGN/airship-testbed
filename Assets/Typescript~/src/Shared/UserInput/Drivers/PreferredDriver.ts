import { Signal } from "Shared/Util/Signal";

export class PreferredDriver {
	private static inst: PreferredDriver;

	private scheme = UserInputService.InputProxy.GetScheme();

	public readonly SchemeChanged = new Signal<[scheme: string]>();

	private constructor() {
		// UserInputService.InputProxy.OnSchemeChangedEvent((scheme) => {
		// 	this.scheme = scheme;
		// 	this.SchemeChanged.Fire(scheme);
		// });
	}

	public GetScheme() {
		return this.scheme;
	}

	/** **NOTE:** Internal only. Use `Preferred` class instead. */
	public static instance() {
		return (this.inst ??= new PreferredDriver());
	}
}
