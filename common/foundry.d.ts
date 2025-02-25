import * as globalFoundry from '../fvtt-scripts/foundry-esm';

declare global {
	const foundry = globalFoundry;
}

declare interface EntityConfigData<T> {
	blankLabel: string
	defaultClass: string
	entityName: string
	isGM: true
	object: T
	options: object
	sheetClass: string
	sheetClasses: object
}