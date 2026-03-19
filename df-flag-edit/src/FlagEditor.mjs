/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";
import { parseHTML } from '../common/fvtt.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class FlagEditor extends HandlebarsApplicationMixin(ApplicationV2) {
	// region Static Methods and Properties
	static #PREF_LAST_OBJ = 'FlagEditor.LastObject';
	/** @type {import("../common/fvtt.mjs").ApplicationConfiguration} */
	static DEFAULT_OPTIONS = {
		position: {
			width: 500,
			height: 600,
		},
		window: {
			resizable: true,
			minimizable: true,
			contentClasses: ['df-flag-edit']
		},
		actions: {
			cancel: this.#cancel,
			apply: this.#apply,
			save: this.#save
		}
	};

	/** @type {import("../common/fvtt.mjs").ApplicationParts} */
	static get PARTS() {
		return {
			content: {
				template: `modules/${SETTINGS.MOD_NAME}/templates/flag-edit-content.hbs`,
				scrollable: false
			},
			footer: {
				template: `modules/${SETTINGS.MOD_NAME}/templates/flag-edit-footer.hbs`
			}
		};
	}

	/** @returns {string} */
	static get lastObject() {
		return SETTINGS.get(FlagEditor.#PREF_LAST_OBJ);
	}
	/** @param {string} uuid_or_path */
	static setLastObject(uuid_or_path) {
		return SETTINGS.set(FlagEditor.#PREF_LAST_OBJ, uuid_or_path);
	}

	static init() {
		SETTINGS.register(FlagEditor.#PREF_LAST_OBJ, { scope: 'client', type: String, default: '', config: false });
		Hooks.on('renderSettings', (/**@type {Settings}*/ _, /**@type {HTMLElement}*/ html) => {
			if (!game.user.isGM) return;
			const captureButton = parseHTML(`<button type="button" data-action="openApp" data-app="edit-json"><i class="fas fa-code" inert></i>${'DF_FLAG_EDIT.EditButtonLabel'.localize()}</button>`);
			captureButton.onclick = () => (new FlagEditor()).render(true);
			html.querySelector('section#settings>section.info').appendChild(captureButton);
		});
	}

	/**
	 * @param {any} target 
	 * @returns {Promise<boolean>}
	 */
	static async isID(target) {
		return !!(await fromUuid(target));
	}
	/**
	 * @param {any} target 
	 * @returns {boolean}
	 */
	static isDocument(target) {
		return target?.flags !== undefined || target?._source !== undefined;
	}
	/**
	 * @param {string} target 
	 * @returns {FoundryDocument | string | null}
	 */
	static evaluateDocument(target) { return eval(target); }

	/**@type {Promise<unknown> | null}*/ static #loadEditorPromise = null;
	/**
	 * @returns {Promise<void}
	 */
	static #loadEditor() {
		// Resolve immediately if element exists
		if (this.#loadEditorPromise == null) {
			// If the Editor library has not yet been loaded, lets load it now inside a promise
			this.#loadEditorPromise = new Promise(res => {
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
		return this.#loadEditorPromise;
	}

	/** @this {FlagEditor} */
	static #cancel() { this.close(); }

	/** @this {FlagEditor} */
	static async #save() {
		FlagEditor.#apply.call(this);
		this.close();
	}

	/** @this {FlagEditor} */
	static async #apply() {
		if (this.document?.flags === undefined || this.document?.flags === null)
			return;
		this.#saveButton.toggleAttribute('disabled', true);
		this.#applyButton.toggleAttribute('disabled', true);
		const flags = this.#editor.get();
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
		await this.#document.update({ flags });
		this.#editor.set(this.#document?.flags || '');
		this.#saveButton.toggleAttribute('disabled', false);
		this.#applyButton.toggleAttribute('disabled', false);
	}
	// endregion

	/**@type {HTMLButtonElement}*/#saveButton;
	/**@type {HTMLButtonElement}*/#applyButton;
	/**@type {HTMLInputElement}*/#search;
	/**@type {HTMLElement}*/#code;
	/**@type {HTMLElement}*/#errorFlag;
	/** @type {HTMLElement} */get element() { return super.element; }
	/**@type {JSONEditor}*/#editor;
	/**@type {FoundryDocument | null}*/#document = null;
	get document() { return this.#document; }
	set document(value) {
		this.#document = value;
		this.#editor.set(this.#document?.flags || '');
	}

	constructor() {
		super(/** @type {import("../common/fvtt.mjs").ApplicationConfiguration} */({
			window: { title: 'DF_FLAG_EDIT.Title'.localize().replace(' - {0} ({1})', '') }
		}));
	}


	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.path = FlagEditor.lastObject;
		return context;
	}

	/**
	 * Attach event listeners to rendered template parts.
	 * @param {string} partId                       The id of the part being rendered
	 * @param {HTMLElement} htmlElement             The rendered HTML element for the part
	 * @param {ApplicationRenderOptions} _options    Rendering options passed to the render method
	 * @protected
	 */
	async _attachPartListeners(partId, htmlElement, _options) {
		if (partId == "footer") {
			this.#saveButton = htmlElement.querySelector('button[data-action="save"]');
			this.#applyButton = htmlElement.querySelector('button[data-action="apply"]');
			return;
		}
		if (partId != "content") return;
		this.#code = htmlElement.querySelector(":scope>code");
		this.#errorFlag = htmlElement.querySelector("search>i");
		this.#search = htmlElement.querySelector("search>input");
		this.#search.oninput = e => this.#search.onchange(e);
		this.#search.onchange = _ => this.#handlePathChange(this.#search.value.trim());

		await FlagEditor.#loadEditor();
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
		this.#editor = new JSONEditor(this.#code, editorOptions);
		if (!this.#document)
			await this.#handlePathChange(FlagEditor.lastObject);
	}

	/**
	 * @param {string} [error]
	 */
	#showError(error) {
		this.#errorFlag.setAttribute('aria-label', error || game.i18n.localize('DF_FLAG_EDIT.ErrorObjectNotFound'));
		this.#errorFlag.classList.toggle('hidden', false);
		this.document = null;
		this._updateTitle();
	}
	#hideError() {
		this.#errorFlag.classList.toggle('hidden', true);
	}
	#updateTitle() {
		this.options.window.title = game.i18n.localize('DF_FLAG_EDIT.Title')
			.replace('{0}', this.document !== null ? Object.getPrototypeOf(this.document).constructor.name : '#')
			.replace('{1}', this.document?._id || '#');
		this.element.querySelector('header>.window-title').textContent = this.options.window.title;
	}
	async #handlePathChange(/**@type {string}*/ data) {
		await FlagEditor.setLastObject(data);
		/**@type {FoundryDocument | null}*/ let document;
		if (data.length === 0) {
			this.#hideError();
			document = null;
			return;
		}
		try {
			// If we are an ID
			if (await FlagEditor.isID(data))
				document = await fromUuid(data);
			// we are an object path
			else {
				let temp = FlagEditor.evaluateDocument(data);
				// If the result is NOT a Document/Data
				if (!FlagEditor.isDocument(temp)) {
					// If the Object Path result is an ID
					if ((temp instanceof String || typeof temp === 'string') && await FlagEditor.isID(temp)) {
						temp = await fromUuid(temp);
					} else throw 'Invalid object from path';
				}
				document = temp;
			}
		} catch (error) {
			this.#showError(error);
			document = null;
			return;
		}
		if (document?.flags === undefined || document?.flags === null) {
			this.#showError('Invalid object: does not contain a flags field');
			return;
		}
		this.#hideError();
		this.document = document;
		this.#updateTitle();
	}
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
