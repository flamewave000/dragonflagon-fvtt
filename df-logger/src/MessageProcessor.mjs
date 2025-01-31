
export default class MessageProcessor {
	/** @type {Promise<void>} */static messageLoadJob = null;
	/** @type {Message[]} */static loginMessages = [];
	/** @type {Message[]} */static logoutMessages = [];

	/** @returns { Promise<void> } */
	static loadMessages() {
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
		const file = new File([JSON.stringify({
			login: this.loginMessages,
			logout: this.logoutMessages
		})], 'user-logger-messages.json', { type: 'application/json' });
		/** @type {FilePickerResponse}*/const response = await FilePicker.upload('data', '', file);
		if (!response.path)
			throw new Error('Could not upload the login.json to server');
	}

	static async initializeMessages() {
		/** @type {Messages}*/const i18n = game.i18n.translations['DF-LOGGER'];
		for (const msg of i18n.LoginMsg) {
			this.loginMessages.push({ tog: true, msg });
		}
		for (const msg of i18n.LogoutMsg) {
			this.logoutMessages.push({ tog: true, msg });
		}
	}
}