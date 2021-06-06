
interface Document<T> {
	id: string;
	object: T;
	layer: PlaceablesLayer;
}

declare class WallDocument extends Document<Wall> {
	constructor(data: Wall.Data, options = {})
}