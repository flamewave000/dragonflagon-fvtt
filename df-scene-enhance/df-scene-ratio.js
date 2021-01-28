// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduce(numerator, denominator) {
	var a = numerator;
	var b = denominator;
	var c;
	while (b) {
		c = a % b; a = b; b = c;
	}
	return [numerator / a, denominator / a];
}
function floatVal(input) {
	return parseFloat(input.val());
}
function intVal(input) {
	return parseInt(input.val());
}

export default class DFSceneRatio {
	static MODULE = 'df-scene-enhance';

	initialWidth = 0;
	initialHeight = 0;

	widthField = null;
	heightField = null;
	lockRatio = null;
	customRatio = null;
	numerator = null;
	denominator = null;
	applyRatio = null;
	scale = null;
	applyScale = null;

	isLocked = false;
	useCustom = false;


	get _width() { return intVal(this.widthField); }
	set _width(value) { this.widthField.val(value); }
	get _height() { return intVal(this.heightField); }
	set _height(value) { this.heightField.val(value); }

	get _numerator() { return floatVal(this.numerator); }
	set _numerator(value) { this.numerator.val(value); }
	get _denominator() { return floatVal(this.denominator); }
	set _denominator(value) { this.denominator.val(value); }

	get _scale() { return floatVal(this.scale); }
	set _scale(value) { this.scale.val(value); }


	_updateScale() {
		this.scale.val(((this._width / this.initialWidth) + (this._height / this.initialHeight)) / 2.0);
	}
	_updateRatio() {
		const [num, den] = reduce(this._width, this._height);
		this._numerator = num;
		this._denominator = den;
	}

	_performDimensionChange(width, height) {
		this._updateScale();
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
		const scale = this._scale
		if (isNaN(num) || isNaN(den) || isNaN(scale)) return;
		if ((num == den && this._width > this._height) || num > den) {
			this._width = Math.round(this.initialWidth * scale);
			this._height = Math.round(((this.initialWidth * scale) / num) * den);
		} else {
			this._width = Math.round(((this.initialHeight * scale) / den) * num);
			this._height = Math.round(this.initialHeight * scale);
		}
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
		this._updateScale();
	}

	async render(_app, html, data) {
		this.initialWidth = data.entity.width;
		this.initialHeight = data.entity.height;
		const [numerator, denominator] = reduce(data.entity.width, data.entity.height);
		const ratioData = {
			numerator: numerator,
			denominator: denominator
		};
		const ratioHtml = $(await renderTemplate(`modules/${DFSceneRatio.MODULE}/templates/scene-ratio.hbs`, ratioData));
		const dimHtml = html.find('#df-thumb-group').next();
		this.widthField = dimHtml.find('input[name="width"]');
		this.heightField = dimHtml.find('input[name="height"]');
		ratioHtml.insertAfter(dimHtml);
		this._extractFields(ratioHtml);
		this._attachListeners(ratioHtml);
		await this._updateOriginalImageDimensions(data.entity.img);
	}
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

		this.lockRatio.on('change', () => { this.isLocked = this.lockRatio[0].checked; })
		this.customRatio.on('change', () => {
			this.useCustom = this.customRatio[0].checked;
			this.numerator.prop('disabled', this.useCustom == false);
			this.denominator.prop('disabled', this.useCustom == false);
			this.applyRatio.prop('disabled', this.useCustom == false);
		});
		this.applyScale.on('click', () => this._performScale());
		this.applyRatio.on('click', () => this._performRatio());
	}

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