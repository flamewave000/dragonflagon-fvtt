declare global {
	interface String {
		dfmr_replaceAll(token: string, replacement: string): string;
	}
}

/***** Pathfinder1 Roller Declaration *****/
declare class RollPF {
	static safeRoll(p1: any, p2: any): any;
}

interface RollPromptData {
	id: number;
	res: AnyFunction;
	term: DiceTerm;
}

interface RenderData {
	id: string;
	idx: number;
	faces: string;
	hasTotal: boolean;
	term: DiceTerm
}