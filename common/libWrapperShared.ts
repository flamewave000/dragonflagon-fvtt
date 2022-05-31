import SETTINGS from "./Settings";

type Wrapper = (...args: any) => unknown;
type Handler = (wrapped: Wrapper, ...args: any) => unknown;

class Registration {
	nextId = 0;
	wrappers = new Map<number, Handler>();

	handler(context: any, wrapped: Wrapper, ...args: any): Promise<unknown> | unknown {
		let current = wrapped;
		for (const wrapper of this.wrappers.values()) {
			const next = current;
			current = (...args: any) => wrapper.call(context, next, ...args);
		}
		return current.call(context, ...args);
	}
}

export default class libWrapperShared {
	private static registrations = new Map<string, Registration>();

	static register(target: string, handler: Handler) {
		let registration = this.registrations.get(target);
		if (!registration) {
			registration = new Registration();
			libWrapper.register(SETTINGS.MOD_NAME, target,
				function (this: any, wrapped: Wrapper, ...args: any) { return registration.handler(this, wrapped, ...args); }, 'WRAPPER');
			this.registrations.set(target, registration);
		}
		const id = registration.nextId++;
		registration.wrappers.set(id, handler);
		return id;
	}

	static unregister(target: string, id: number): boolean {
		const registration = this.registrations.get(target);
		if (!registration) return false;
		registration.wrappers.delete(id);
		if (registration.wrappers.size === 0) {
			libWrapper.unregister(SETTINGS.MOD_NAME, target, false);
			this.registrations.delete(target);
		}
		return true;
	}
}