export {};
declare global {
	interface Application {
		_recalculateDimensions(): void;
	}
	namespace marked {
		function parse(md: string, options: any): string;
	}
}