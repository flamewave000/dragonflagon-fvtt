Hooks.on('getRollTableDirectoryEntryContext', function (html, entryOptions) {
	entryOptions.unshift({
		name: "DF_QUICK_ROLL.Roll",
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: () => true,
		callback: async header => {
			const table = game.tables.get(header.data('entityId'));
			const roll = table.roll();
			await table.draw({ roll: roll });
		}
	});
})