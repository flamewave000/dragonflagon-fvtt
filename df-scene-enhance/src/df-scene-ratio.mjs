/// <reference path="../types/CanvasDims.d.ts" />
/// <reference path="../../fvtt-scripts/foundry.js" />
/**
 * Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
 * @param {number} numerator
 * @param {number} denominator
 * @returns {[number, number]}
 */
function reduce(numerator, denominator) {
	let a = numerator;
	let b = denominator;
	let c;
	while (b) {
		c = a % b; a = b; b = c;
	}
	return [numerator / a, denominator / a];
}
/**
 * @param {JQuery<HTMLElement>} input
 * @returns {number}
 */
function floatVal(input) {
	return parseFloat(input.val());
}
/**
 * @param {JQuery<HTMLElement>} input
 * @returns {number}
 */
function intVal(input) {
	return parseInt(input.val());
}

export default class DFSceneRatio {
	static MODULE = 'df-scene-enhance';

	initialWidth = 0;
	initialHeight = 0;

	/**@type {JQuery<HTMLInputElement>}*/ widthField = null;
	/**@type {JQuery<HTMLInputElement>}*/ heightField = null;
	/**@type {JQuery<HTMLInputElement>}*/ lockRatio = null;
	/**@type {JQuery<HTMLInputElement>}*/ customRatio = null;
	/**@type {JQuery<HTMLInputElement>}*/ numerator = null;
	/**@type {JQuery<HTMLInputElement>}*/ denominator = null;
	/**@type {JQuery<HTMLElement>}*/      applyRatio = null;
	/**@type {JQuery<HTMLInputElement>}*/ scale = null;
	/**@type {JQuery<HTMLElement>}*/      applyScale = null;

	/**@type {boolean}*/ isLocked = false;
	/**@type {boolean}*/ useCustom = false;


	/**@type {number}*/
	get _width() { return intVal(this.widthField); }
	set _width(value) { this.widthField.val(value); }
	/**@type {number}*/
	get _height() { return intVal(this.heightField); }
	set _height(value) { this.heightField.val(value); }

	/**@type {number}*/
	get _numerator() { return floatVal(this.numerator); }
	set _numerator(value) { this.numerator.val(value); }
	/**@type {number}*/
	get _denominator() { return floatVal(this.denominator); }
	set _denominator(value) { this.denominator.val(value); }

	get _scale() { return floatVal(this.scale); }
	set _scale(value) { this.scale.val(value); }

	_updateRatio() {
		const [num, den] = reduce(this._width, this._height);
		this._numerator = num;
		this._denominator = den;
	}

	/**
	 * @param {number} [width]
	 * @param {number} [height]
	 */
	_performDimensionChange(width, height) {
		if (!this.isLocked) {
			this._updateRatio();
			return;
		}
		const num = this._numerator;
		const den = this._denominator;
		if (isNaN(num) || isNaN(den)) return;
		if (width !== undefined)
			this._height = Math.round((width / num) * den);
		else if (height !== undefined)
			this._width = Math.round((height / den) * num);
		else
			console.error("DFSceneRatio._performDimensionChange(undefined, undefined)");
	}

	_performScale() {
		const num = this._numerator;
		const den = this._denominator;
		const scale = this._scale;
		if (isNaN(num) || isNaN(den) || isNaN(scale)) return;
		this._width = this._width * scale;
		this._height = this._height * scale;
		this._scale = 1;
	}

	_performRatio() {
		const num = this._numerator;
		const den = this._denominator;
		const width = this._width;
		const height = this._height;
		if (isNaN(num) || isNaN(den)) return;
		if (num > den || (num == den && width > height)) {
			this._height = Math.round((width / num) * den);
		} else {
			this._width = Math.round((height / den) * num);
		}
	}

	/**
	 * @param {SceneConfig} app
	 * @param {JQuery<HTMLElement>} html
	 * @param {SceneConfig.Data} data
	 */
	async render(app, html, data) {
		/**@type {Scene}*/
		const document = data.document;
		this.initialWidth = document.width;
		this.initialHeight = document.height;
		/**@type {CanvasDims}*/
		const dims = data.document.dimensions;
		const [numerator, denominator] = reduce(dims.sceneWidth, dims.sceneHeight);
		const ratioData = { numerator, denominator };
		const ratioHtml = $(await renderTemplate(`modules/${DFSceneRatio.MODULE}/templates/scene-ratio.hbs`, ratioData));
		const dimHtml = html.find('input[name="width"]').parent().parent();
		this.widthField = html.find('input[name="width"]');
		this.heightField = html.find('input[name="height"]');
		ratioHtml.insertAfter(dimHtml);
		this._extractFields(ratioHtml);
		this._attachListeners();
		app.linkedDimensions = false;
		html.find('button.dimension-link').remove();
		await this._updateOriginalImageDimensions(document.img);
	}
	/**@param {JQuery<HTMLElement>} html*/
	_extractFields(html) {
		this.lockRatio = html.find('input[name="lockRatio"]');
		this.customRatio = html.find('input[name="customRatio"]');
		this.numerator = html.find('input[name="numerator"]');
		this.denominator = html.find('input[name="denominator"]');
		this.applyRatio = html.find('button[name="applyRatio"]');
		this.scale = html.find('input[name="scale"]');
		this.applyScale = html.find('button[name="applyScale"]');
	}
	_attachListeners() {
		this.widthField.on('change', () => this._performDimensionChange(this._width));
		this.heightField.on('change', () => this._performDimensionChange(undefined, this._height));

		this.lockRatio.on('change', () => { this.isLocked = this.lockRatio[0].checked; });
		this.customRatio.on('change', () => {
			this.useCustom = this.customRatio[0].checked;
			this.numerator.prop('disabled', this.useCustom == false);
			this.denominator.prop('disabled', this.useCustom == false);
			this.applyRatio.prop('disabled', this.useCustom == false);
		});
		this.applyScale.on('click', () => this._performScale());
		this.applyRatio.on('click', () => this._performRatio());
	}

	/**
	 * @param {string} url
	 * @returns {Promise<void>}
	 */
	async _updateOriginalImageDimensions(url) {
		return new Promise((resolve, reject) => {
			const image = $(new Image());
			image.on('load', () => {
				this.widthField.attr('placeholder', image[0].width);
				this.heightField.attr('placeholder', image[0].height);
				resolve();
			}).on('error', reject).attr('src', url);
		});
	}
}