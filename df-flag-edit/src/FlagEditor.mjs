/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";

export default class FlagEditor extends Application {
	static PREF_LAST_OBJ = 'FlagEditor.LastObject';

	static IGNORED_COLLECTIONS = [
		"FogExploration",
		"Setting"
	];

	static get defaultOptions() {
		return foundry.utils.mergeObject(/**@type {Partial<ApplicationOptions>}*/Application.defaultOptions, {
			template: `modules/${SETTINGS.MOD_NAME}/templates/flag-edit.hbs`,
			minimizable: true,
			resizable: true,
			height: 500,
			width: 500
		});
	}

	static init() {
		SETTINGS.register(FlagEditor.PREF_LAST_OBJ, { scope: 'client', type: String, default: '', config: false });
		Hooks.on('renderSettings', (/**@type {Settings}*/ _, /**@type {JQuery<HTMLElement>}*/ html) => {
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

	/**@type {FoundryDocument | null}*/ _document = null;
	set document(/**@type {FoundryDocument | null}*/ value) {
		this._document = value;
		this.editor.set(this._document?.flags || '');
	}
	/**@type {FoundryDocument | null}*/
	get document() { return this._document; }
	/**@type {JSONEditor}*/ editor;

	/**
	 * 
	 * @param {boolean|undefined} force 
	 * @param {any|undefined} options 
	 * @returns {Promise<void>}
	 */
	async _render(force, options) {
		await FlagEditor._loadEditor();
		await super._render(force, options);
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
			onCreateMenu: (/**@type { {className:string}[] }*/items, _) => items
				.filter(x => !["jsoneditor-extract", "jsoneditor-transform"].includes(x.className))
		};
		this.editor = new JSONEditor(this.element.find('#editor')[0], editorOptions);
		if (!this.document) {
			await this._handlePathChange(SETTINGS.get(FlagEditor.PREF_LAST_OBJ));
		}

		/**@type {JQuery<HTMLInputElement>}*/
		const input = this.element.find('#object-path');
		input.on('input', () => input.trigger('change'));
		input.on('change', async () => this._handlePathChange(input.val().trim()));
		this.element.find('#cancel').on('click', () => this.close());
		const applyButton = this.element.find('#apply');
		const saveButton = this.element.find('#save');
		saveButton.on('click', () => {
			applyButton.trigger('click');
			this.close();
		});
		applyButton.on('click', async () => {
			if (this.document?.flags === undefined || this.document?.flags === null)
				return;
			saveButton.prop('disabled', true);
			applyButton.prop('disabled', true);
			const flags = this.editor.get();
			const newKeys = Object.keys(flags)
				.flatMap(x => Object.keys(flags[x]).map(y => `${x}_____${y}`))
				.filter(x => !x.endsWith('_____'));
			const oldKeys = Object.keys(this.document.flags)
				.flatMap(x => {
					if (typeof (this.document.flags[x]) === 'object')
						return Object.keys(this.document.flags[x]).map(y => `${x}_____${y}`);
					else return x;
				})
				.filter(x => !x.endsWith('_____'));
			const deleted = oldKeys.filter(x => !newKeys.includes(x));
			for (const flag of deleted) {
				if (!flag.includes('_____')) {
					delete flags[flag];
					flags['-=' + flag] = null;
					continue;
				}
				const scope = flag.split('_____')[0];
				const key = flag.split('_____')[1];
				try {
					// await this.document.unsetFlag(scope, key);
					const head = key.split('.');
					const tail = `-=${head.pop()}`;
					const t = [...head, tail].join('.');
					if (flags[scope] === undefined)
						flags[scope] = {};
					flags[scope][t] = null;
				}
				catch (err) { console.warn(err); }
			}
			for (const scope of Object.keys(flags)) {
				if (flags[scope] === null || flags[scope] === undefined) {
					if (scope.startsWith('-=')) continue;
					delete flags[scope];
					flags['-=' + scope] = null;
				}
				else if (Object.keys(flags[scope]).every(x => x.startsWith('-='))) {
					delete flags[scope];
					flags['-=' + scope] = null;
				}
			}
			await this.document.update({ flags });
			this.editor.set(this._document?.flags || '');
			saveButton.prop('disabled', false);
			applyButton.prop('disabled', false);
		});
	}

	/**@type {Promise<unknown> | null}*/ static _loadEditorPromise = null;
	/**
	 * @returns {Promise<void}
	 */
	static _loadEditor() {
		// Resolve immediately if element exists
		if (this._loadEditorPromise == null) {
			// If the Editor library has not yet been loaded, lets load it now inside a promise
			this._loadEditorPromise = new Promise(res => {
				/**@type {HTMLScriptElement}*/ const script = document.createElement('script');
				script.async = true;
				script.onload = () => res();
				// If the Ace Lib is installed and running
				if ('ace' in window)
					script.src = `/modules/${SETTINGS.MOD_NAME}/libs/jsoneditor-minimalist.min.js`;
				else
					script.src = `/modules/${SETTINGS.MOD_NAME}/libs/jsoneditor.min.js`;
				document.body.append(script);
			});
		}
		return this._loadEditorPromise;
	}

	_showError(/**@type {string|undefined}*/error) {
		const el = this.element.find('.error');
		el.attr('title', error || game.i18n.localize('DF_FLAG_EDIT.ErrorObjectNotFound'));
		el.show();
		this.document = null;
		this._updateTitle();
	}
	_hideError() {
		this.element.find('.error').hide();
	}
	_updateTitle() {
		this.options.title = game.i18n.localize('DF_FLAG_EDIT.Title')
			.replace('{0}', this.document !== null ? Object.getPrototypeOf(this.document).constructor.name : '#')
			.replace('{1}', this.document?._id || '#');
		this.element.find('h4.window-title').text(this.options.title);
	}

	getData() {
		return {
			path: SETTINGS.get(FlagEditor.PREF_LAST_OBJ)
		};
	}

	async _handlePathChange(/**@type {string}*/ data) {
		await SETTINGS.set(FlagEditor.PREF_LAST_OBJ, data);
		/**@type {FoundryDocument | null}*/ let document;
		if (data.length === 0) {
			this._hideError();
			document = null;
			return;
		}
		try {
			// If we are an ID
			if (FlagEditor.isID(data))
				document = await fromUuid(data);
			// we are an object path
			else {
				let temp = FlagEditor.evaluateDocument(data);
				// If the result is NOT a Document/Data
				if (!FlagEditor.isDocument(temp)) {
					// If the Object Path result is an ID
					if ((temp instanceof String || typeof temp === 'string') && FlagEditor.isID(temp)) {
						temp = await fromUuid(temp);
					} else throw 'Invalid object from path';
				}
				document = temp;
			}
		} catch (error) {
			this._showError(error);
			document = null;
			return;
		}
		if (document?.flags === undefined || document?.flags === null) {
			this._showError('Invalid object: does not contain a flags field');
			return;
		}
		this._hideError();
		this.document = document;
		this._updateTitle();
	}

	/**
	 * @param {any} target 
	 * @returns {boolean}
	 */
	static isID(target) {
		return !!fromUuidSync(target);
	}
	/**
	 * @param {any} target 
	 * @returns {boolean}
	 */
	static isDocument(target) {
		return target?.data !== undefined || target?.document !== undefined;
	}
	/**
	 * @param {string} target 
	 * @returns {FoundryDocument | string | null}
	 */
	static evaluateDocument(target) { return eval(target); }
}


window.showFlagEditorForDocument = async (document) => {
	if (document.data === undefined) {
		if (document.document === undefined) {
			if (document instanceof String || typeof document === 'string') {
				document = await fromUuid(document);
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