
declare interface Option {
	type?: string;
	label: string;
	desc: string;
}

declare interface Config {
	circle: string;
	cone: string;
	rect: string;
	ray: string;
}

declare interface Data extends Config {
	options: Option[];
}
