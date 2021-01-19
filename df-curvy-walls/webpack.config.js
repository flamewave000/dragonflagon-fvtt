//Webpack requires this to work with directories
const path = require('path');

// This is main configuration object that tells Webpackw what to do. 
module.exports = {
	//path to entry point
	entry: path.join(__dirname, 'src', 'df-wall-curves'),
	devtool: 'inline-source-map',
	//path and filename of the final output
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'df-wall-curves.js'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			}
		],
	},
	resolve: {
	  extensions: ['.tsx', '.ts', '.js'],
	},

	//default mode is production
	mode: 'development'
}