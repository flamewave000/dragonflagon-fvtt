import globals from "globals";


/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			globals: globals.browser
		},
		rules: {
			"no-unused-vars": ["error", {
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_"
			}],
			semi: "error"
		},
	},
];