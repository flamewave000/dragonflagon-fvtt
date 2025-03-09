/// <reference path="./types.d.ts" />
/**@type {EaseFunctionRegister} */
const EaseFunctions = {
	linear: x => x,
	linearLoop: x => x < 0.5 ? x : (1 - x),
	quadIn: x => 1 - ((x - 1) * (x - 1)),
	quadOut: x => x * x,
	quadFull: x => 4 * ((x - 0.5) * (x - 0.5) * (x - 0.5)) + 0.5,
	quadLoop: x => -4 * ((x - 0.5) * (x - 0.5)) + 1,
	ellipseIn: x => Math.sin(x * Math.PI * 0.5),
	ellipseOut: x => Math.sin((x - 1) * Math.PI * 0.5) + 1,
	ellipseFull: x => Math.pow(Math.sin(x * Math.PI * 0.5), 2),
	ellipseLoop: x => Math.sin(x * Math.PI),
	fixedStart: x => x === 1 ? 0 : 1,
	fixedEnd: x => x === 0 ? 0 : 1
};
export default EaseFunctions;