// If Ace Library is installed and enabled, this will exist
declare const ace: any;

declare class JSONEditor {
	constructor(container: HTMLElement, options: JSONEditor.Options);
	aceEditor: {
		session: {
			setUseSoftTabs: (show: boolean) => void
		},
		setShowInvisibles: (show: boolean) => void
	};
	get: () => Record<string, Record<string, any>>;
	set: (e: any) => void;
	setText: (e: string) => void;
	updateText: (e: string) => void;
	format: () => void;
	setMode: (mode: string) => void;
}

declare namespace JSONEditor {
	interface Options {
		limitDragging: boolean,
		mode: string,
		modes: string[],
		indentation: number,
		mainMenuBar: boolean,
		navigationBar: boolean,
		statusBar: boolean,
		colorPicker: boolean
	}
}

declare interface FoundryDocument {
	_id: string;
	flags: any;
	update: (data: any) => Promise<any>
	unsetFlag(scope: string, key: string): Promise<unknown>
}