
declare interface ContextOption {
	name: string;
	icon: string;
	condition?: (li: JQuery<HTMLLIElement>) => boolean;
	callback: ((li: JQuery<HTMLLIElement>) => Promise<unknown>) | ((li: JQuery<HTMLLIElement>) => void)
}