import SETTINGS from "../../common/Settings";

//#region Type Definitions
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

declare interface FoundryData {
	_id: string;
	flags: any;
	document: FoundryDocument;
}

declare interface FoundryDocument {
	data: FoundryData;
	update: (data: any) => Promise<any>
	unsetFlag(scope: string, key: string): Promise<unknown>
}
//#endregion

export default class FlagEditor extends Application {
	static readonly PREF_LAST_OBJ = 'FlagEditor.LastObject';

	private static readonly IGNORED_COLLECTIONS = [
		"FogExploration",
		"Setting"
	];

	static get defaultOptions(): any {
		return mergeObject(<Partial<Application.Options>>Application.defaultOptions, {
			template: `modules/${SETTINGS.MOD_NAME}/templates/flag-edit.hbs`,
			minimizable: true,
			resizable: true,
			height: 500,
			width: 500
		});
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private static async _findObject(id: string | String): Promise<FoundryDocument | null> {
		if (typeof id !== 'string' && !(id instanceof String)) return Promise.reject("Invalid parameter: id must be type 'string'");
		return await new Promise<FoundryDocument | null>((res, rej) => {
			// Search the collections
			const collections = game.collections;
			for (const [key, map] of collections.entries()) {
				if (FlagEditor.IGNORED_COLLECTIONS.includes(key) || !map.has(<any>id)) continue;
				res(map.get(<any>id));
				break;
			}
			rej();
		}).catch(() => new Promise<FoundryDocument | null>((res, rej) => {
			// Search the layers
			for (const layer of canvas.layers) {
				if (!(layer instanceof PlaceablesLayer)) continue;
				if (!(<Map<string, FoundryDocument>>(<any>layer).documentCollection).has(<string>id)) continue;
				res((<Map<string, FoundryDocument>>(<any>layer).documentCollection).get(<string>id));
				break;
			}
			rej();
		})).catch(() => Promise.resolve<FoundryDocument | null>(null));
	}

	static init() {
		SETTINGS.register(FlagEditor.PREF_LAST_OBJ, { scope: 'client', type: String, default: '', config: false });
		Hooks.on('renderSettings', (_: Settings, html: JQuery<HTMLElement>) => {
			if (!game.user.isGM) return;
			const captureButton = $(`<div><button data-action="edit-json"><i class="fas fa-code"></i>${game.i18n.localize('DF_FLAG_EDIT.EditButtonLabel')}</button></div>`);
			captureButton.find('button').on('click', () => (new FlagEditor()).render(true));
			html.find('#game-details').after(captureButton);
		});
	}

	constructor() {
		super({
			title: game.i18n.localize('DF_FLAG_EDIT.Title').replace(' - {0} ({1})', '')
		});
	}

	private _document: FoundryDocument | null = null;
	set document(value: FoundryDocument | null) {
		this._document = value;
		this.editor.set(this._document?.data?.flags || '');
	}
	get document(): FoundryDocument | null { return this._document; }
	editor: JSONEditor;

	async _render(force?: boolean, options?: any): Promise<void> {
		await FlagEditor._loadEditor();
		const result = await super._render(force, options);
		const editorOptions = {
			// If the Ace Lib is installed and running
			ace: 'ace' in window ? ace : undefined,
			limitDragging: false,
			mode: 'tree',
			modes: ['tree', 'code'],
			indentation: 4,
			mainMenuBar: true,
			navigationBar: true,
			statusBar: true,
			colorPicker: true,
			onCreateMenu: (items: any, _: any) => (items as { className: string }[])
				.filter(x => !["jsoneditor-extract", "jsoneditor-transform"].includes(x.className))
		};
		this.editor = new JSONEditor(this.element.find('#editor')[0], editorOptions);
		if (!this.document) {
			await this._handlePathChange(SETTINGS.get(FlagEditor.PREF_LAST_OBJ));
		}

		const input = this.element.find('#object-path');
		input.on('input', () => input.trigger('change'));
		input.on('change', async () => this._handlePathChange((input.val() as string).trim()));
		this.element.find('#cancel').on('click', () => this.close());
		const applyButton = this.element.find('#apply');
		const saveButton = this.element.find('#save');
		saveButton.on('click', () => {
			this.element.find('#apply').trigger('click');
			this.close();
		});
		applyButton.on('click', async () => {
			if (this.document?.data?.flags === undefined || this.document?.data?.flags === null)
				return;
			saveButton.prop('disabled', true);
			applyButton.prop('disabled', true);
			const flags = this.editor.get();
			console.log(flags);
			const newKeys = Object.keys(flags).map(x => `${x}_____${Object.keys(flags[x])}`);
			const oldKeys = Object.keys(this.document.data.flags)
				.flatMap(x => Object.keys(this.document.data.flags[x]).map(y => `${x}_____${y}`))
				.filter(x => !x.endsWith('_____'));
			const deleted = oldKeys.filter(x => !newKeys.includes(x));
			for (const flag of deleted) {
				const scope = flag.split('_____')[0];
				const key = flag.split('_____')[1];
				try {
					// await this.document.unsetFlag(scope, key);
					const head = key.split('.');
					const tail = `-=${head.pop()}`;
					const t = [scope, ...head, tail].join('.');
					flags[t] = null;
				}
				catch (err) { console.warn(err); }
			}
			await this.document.update({ flags });
			this.editor.set(this._document?.data?.flags || '');
			saveButton.prop('disabled', false);
			applyButton.prop('disabled', false);
		});
		return result;
	}

	private static _loadEditorPromise: Promise<unknown> = null;
	private static _loadEditor(): Promise<void> {
		// Resolve immediately if element exists
		if (this._loadEditorPromise == null) {
			// If the Editor library has not yet been loaded, lets load it now inside a promise
			const scriptPromise = new Promise<void>(res => {
				const script = document.createElement('script') as HTMLScriptElement;
				script.async = true;
				script.onload = () => res();
				// If the Ace Lib is installed and running
				if ('ace' in window)
					script.src = `/modules/${SETTINGS.MOD_NAME}/libs/jsoneditor-minimalist.min.js`;
				else
					script.src = `/modules/${SETTINGS.MOD_NAME}/libs/jsoneditor.min.js`;
				document.body.append(script);
			});
			const stylePromise = new Promise<void>(res => {
				const style = document.createElement('link') as HTMLLinkElement;
				style.rel = 'stylesheet';
				style.type = 'text/css';
				style.onload = () => res();
				style.href = `/modules/${SETTINGS.MOD_NAME}/libs/jsoneditor.min.css`;
				document.body.append(style);
			});
			this._loadEditorPromise = Promise.all([scriptPromise, stylePromise]);
		}
		return <Promise<void>>this._loadEditorPromise;
	}

	private _showError(error?: string) {
		const el = this.element.find('.error');
		el.attr('title', error || game.i18n.localize('DF_FLAG_EDIT.ErrorObjectNotFound'));
		el.show();
		this.document = null;
		this._updateTitle();
	}
	private _hideError() {
		this.element.find('.error').hide();
	}
	private _updateTitle() {
		this.options.title = game.i18n.localize('DF_FLAG_EDIT.Title')
			.replace('{0}', this.document !== null ? Object.getPrototypeOf(this.document).constructor.name : '#')
			.replace('{1}', this.document?.data?._id || '#');
		this.element.find('h4.window-title').text(this.options.title);
	}

	getData(): any {
		return {
			path: SETTINGS.get(FlagEditor.PREF_LAST_OBJ)
		};
	}

	private async _handlePathChange(data: string) {
		await SETTINGS.set(FlagEditor.PREF_LAST_OBJ, data);
		let document: FoundryDocument | null;
		if (data.length === 0) {
			this._hideError();
			document = null;
			return;
		}
		try {
			// If we are an ID
			if (FlagEditor.isID(data))
				document = await FlagEditor.extractID(data);
			// we are an object path
			else {
				let temp = FlagEditor.evaluateDocument(data);
				// If the result is NOT a Document/Data
				if (!FlagEditor.isDocument(temp)) {
					// If the Object Path result is an ID
					if ((temp instanceof String || typeof temp === 'string') && FlagEditor.isID(temp)) {
						temp = await FlagEditor.extractID(temp as string);
					} else throw 'Invalid object from path';
				}
				document = <FoundryDocument | null>temp;
			}
		} catch (error) {
			this._showError(error as string);
			document = null;
			return;
		}
		if (document?.data === undefined || document?.data === null) {
			if ((<any>document)?.document === undefined || (<any>document)?.document === null) {
				this._showError("Invalid object: document must be of type 'string', 'Document', or 'DocumentData'");
				return;
			}
			else document = (<any>document)?.document;
		}
		if (document?.data?.flags === undefined || document?.data?.flags === null) {
			this._showError('Invalid object: does not contain a flags field');
			return;
		}
		this._hideError();
		this.document = document;
		this._updateTitle();
	}

	private static isID(target: any): boolean {
		return /^['"`]?[a-z0-9]+['"`]?$/im.test(target);
	}
	private static isDocument(target: any): boolean {
		return target?.data !== undefined || target?.document !== undefined;
	}
	private static extractID(target: string): Promise<FoundryDocument | null> {
		return FlagEditor._findObject(target.match(/^['"`]?([a-z0-9]+)['"`]?$/im)[1]);
	}
	private static evaluateDocument(target: string): FoundryDocument | string | null { return eval(target); }
}


(<any>window).showFlagEditorForDocument = async (document: any) => {
	if (document.data === undefined) {
		if (document.document === undefined) {
			if (document instanceof String || typeof document === 'string') {
				document = (<any>FlagEditor)._findObject(document);
			}
			else throw Error("Invalid object: document must be of type 'string', 'Document', or 'DocumentData'");
		}
		else document = document.document;
	}
	// If nothing was found, throw an error
	if (document === null) {
		ui.notifications.error(`Could not find an object with ID '${document}'`);
		console.error(`Could not find an object with ID '${document}'`);
		return;
	}
	const editor = new FlagEditor();
	await editor.render(true);
	editor.document = document;
};