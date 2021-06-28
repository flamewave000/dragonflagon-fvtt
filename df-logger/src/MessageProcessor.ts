
export interface Message {
	tog: boolean;
	msg: string;
}

export class MessageProcessor {

	static messageLoadJob: Promise<void> = null;
	static loginMessages: Message[] = [];
	static logoutMessages: Message[] = [];

	static loadMessages(): Promise<void> {
		this.messageLoadJob = new Promise(async (res, rej) => {
			const response = await fetch('user-logger-messages.json');
			if (response.ok) {
				const data = await response.json().catch(error => console.error(`Failed to read JSON for messages.json\n${error}`));
				this.loginMessages = data.login;
				this.logoutMessages = data.logout;
			}
			else if (response.status === 404) {
				await this.initializeMessages();
				await this.saveMessages();
			}
			else {
				rej(new Error('Could not access the messages file from server side'));
				return;
			}
			res();
		});
		return this.messageLoadJob;
	}
	static async saveMessages() {
		// Create the File and contents
		var file = new File([JSON.stringify({
			login: this.loginMessages,
			logout: this.logoutMessages
		})], 'user-logger-messages.json', { type: 'application/json' });
		var response: { path?: string; message?: string } = <any>await FilePicker.upload('data', '', file);
		if (!response.path)
			throw new Error('Could not upload the login.json to server');
	}

	static async initializeMessages() {
		for (let c = 0; c < 38; c++) {
			this.loginMessages.push({
				tog: true,
				msg: game.i18n.localize(`DF-LOGGER.LoginMsg.${c}`)
			});
		}
		for (let c = 0; c < 1; c++) {
			this.logoutMessages.push({
				tog: true,
				msg: game.i18n.localize(`DF-LOGGER.LogoutMsg.${c}`)
			});
		}
	}
}