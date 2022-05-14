
// float cabable gcd solver that finds the lowest value within a tollerance
function fgcd(a: number, b: number, tol: number = 0) {
	if (b > a) { [a, b] = [b, a]; } // for consistancy
	for (let i = 1; i <= b; i++) {
		let j = (i * a) / b;
		if (Math.abs(j - Math.round(j)) < tol) { return b / i; }
	}
	return 1;
}
// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduce(numerator: number, denominator: number, tol: number = 0.01) {
	let gcd = fgcd(numerator, denominator, tol);
	return [numerator / gcd, denominator / gcd];
}
function floatVal(input: JQuery<HTMLElement>) {
	return parseFloat(input.val() as string);
}
function intVal(input: JQuery<HTMLElement>) {
	return parseInt(input.val() as string);
}

export default class DFSceneRatio {
	static MODULE = 'df-scene-enhance';

	initialWidth = 0;
	initialHeight = 0;

	widthField: JQuery<HTMLInputElement> = null;
	heightField: JQuery<HTMLInputElement> = null;
	lockRatio: JQuery<HTMLInputElement> = null;
	customRatio: JQuery<HTMLInputElement> = null;
	numerator: JQuery<HTMLInputElement> = null;
	denominator: JQuery<HTMLInputElement> = null;
	applyRatio: JQuery<HTMLElement> = null;
	scale: JQuery<HTMLInputElement> = null;
	applyScale: JQuery<HTMLElement> = null;

	isLocked: boolean = false;
	useCustom: boolean = false;


	get _width(): number { return intVal(this.widthField); }
	set _width(value: number) { this.widthField.val(value); }
	get _height(): number { return intVal(this.heightField); }
	set _height(value: number) { this.heightField.val(value); }

	get _numerator(): number { return floatVal(this.numerator); }
	set _numerator(value: number) { this.numerator.val(value); }
	get _denominator(): number { return floatVal(this.denominator); }
	set _denominator(value: number) { this.denominator.val(value); }

	get _scale() { return floatVal(this.scale); }
	set _scale(value) { this.scale.val(value); }


	// _updateScale() {
	// 	this.scale.val(((this._width / this.initialWidth) + (this._height / this.initialHeight)) / 2.0);
	// }
	_updateRatio() {
		const [num, den] = reduce(this._width, this._height);
		this._numerator = num;
		this._denominator = den;
	}

	_performDimensionChange(width?: number, height?: number) {
		// this._updateScale();
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
		// if ((num == den && this._width > this._height) || num > den) {
		// 	this._width = Math.round(this.initialWidth * scale);
		// 	this._height = Math.round(((this.initialWidth * scale) / num) * den);
		// } else {
		// 	this._width = Math.round(((this.initialHeight * scale) / den) * num);
		// 	this._height = Math.round(this.initialHeight * scale);
		// }
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
		// this._updateScale();
	}

	async render(_app: any, html: JQuery<HTMLElement>, data: any) {
		const document = <Scene>data.document;
		this.initialWidth = document.data.width;
		this.initialHeight = document.data.height;
		const dims = <Canvas.Dimensions>data.document.dimensions;
		const [numerator, denominator] = reduce(dims.width, dims.height);
		const ratioData = {
			numerator: numerator,
			denominator: denominator
		};
		const ratioHtml = $(await renderTemplate(`modules/${DFSceneRatio.MODULE}/templates/scene-ratio.hbs`, ratioData));
		const dimHtml = html.find('input[name="padding"]').parent().parent().prev();
		this.widthField = dimHtml.find('input[name="width"]') as JQuery<HTMLInputElement>;
		this.heightField = dimHtml.find('input[name="height"]') as JQuery<HTMLInputElement>;
		ratioHtml.insertAfter(dimHtml);
		this._extractFields(ratioHtml);
		this._attachListeners();
		await this._updateOriginalImageDimensions(document.img);
	}
	_extractFields(html: JQuery<HTMLElement>) {
		this.lockRatio = html.find('input[name="lockRatio"]') as JQuery<HTMLInputElement>;
		this.customRatio = html.find('input[name="customRatio"]') as JQuery<HTMLInputElement>;
		this.numerator = html.find('input[name="numerator"]') as JQuery<HTMLInputElement>;
		this.denominator = html.find('input[name="denominator"]') as JQuery<HTMLInputElement>;
		this.applyRatio = html.find('button[name="applyRatio"]');
		this.scale = html.find('input[name="scale"]') as JQuery<HTMLInputElement>;
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

	async _updateOriginalImageDimensions(url: string) {
		return new Promise<void>((resolve, reject) => {
			const image = $(new Image());
			image.on('load', () => {
				this.widthField.attr('placeholder', image[0].width);
				this.heightField.attr('placeholder', image[0].height);
				resolve();
			}).on('error', reject).attr('src', url);
		});
	}
}
