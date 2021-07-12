
const EaseFunctions: {
	[key: string]: (x: number) => number
} = {
	linear: x => x,
	quadIn: x => 1 - ((x - 1) * (x - 1)),
	quadOut: x => x * x,
	quadLoop: x => 1 - ((x - 1) * (x - 1)),
	ellipseIn: x => Math.sin(x * Math.PI * 0.5),
	ellipseOut: x => Math.sin((x - 1) * Math.PI * 0.5) + 1,
	ellipseLoop: x => Math.pow(Math.sin(x * Math.PI * 0.5), 2)
};

export default EaseFunctions;