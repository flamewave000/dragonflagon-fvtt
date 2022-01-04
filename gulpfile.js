const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const del = require('del');
const zip = require('gulp-zip');
const notify = require('gulp-notify');
const stringify = require('json-stringify-pretty-compact');
const replace = require('gulp-replace');
const jsonminify = require('gulp-jsonminify');
const sass = require('gulp-sass')(require('sass'));
const webpack = require('webpack-stream');
const TerserPlugin = require('terser-webpack-plugin');
const concat = require('gulp-concat');
const dts = require('bundle-dts');
const rename = require('gulp-rename');
const tabify = require('gulp-tabify');

const GLOB = '**/*';
const DIST = 'dist/';
const BUNDLE = 'bundle/';
const SOURCE = 'src/';
const LIBS = 'libs/';
const LANG = 'lang/';
const PACKS = 'packs/';
const SOUNDS = 'sounds/';
const TEMPLATES = 'templates/';
const CSS = 'css/';
const LICENSE = '../LICENSE';
const DEV_ENV = '../.devenv';

var PACKAGE = JSON.parse(fs.readFileSync('module.json'));
var DEV_DIR = fs.existsSync(DEV_ENV) ? JSON.parse(fs.readFileSync(DEV_ENV).toString())?.foundry?.data?.trim() + '/Data/modules/' : '';

function reloadPackage(cb) { PACKAGE = JSON.parse(fs.readFileSync('module.json')); cb(); }
function DEV_DIST() { return DEV_DIR + PACKAGE.name + '/'; }

String.prototype.replaceAll = function (pattern, replace) { return this.split(pattern).join(replace); }
function pdel(patterns, options) { return desc(`deleting ${patterns}`, () => { return del(patterns, options); }); }
function plog(message) { return desc('plog', (cb) => { cb(); console.log(message); }); }
function pnotify(message, title = null) {
	const options = {
		message: message,
		onLast: true,
		icon: path.join(__dirname, '.assets', 'logo.png'),
		wait: true
	};
	if (title) options.title = title;
	return desc('notify', () => gulp.src('module.json').pipe(notify(options)));
}
function pwait(timeMs) {
	return desc(`waiting ${timeMs} ms`, (callback) => setTimeout(callback, timeMs));
}
/**
 * Sets the gulp name for a lambda expression
 * @param {string} name Name to be bound to the lambda
 * @param {Function} lambda Expression to be named
 * @returns {Function} lambda
 */
function desc(name, lambda) {
	Object.assign(lambda, { displayName: name });
	return lambda;
}

/**
 * Compile the source code into the distribution directory
 * @param {String} output The output directory for the build
 */
function buildSource(output = null) {
	return desc(`build Source: ./src/${PACKAGE.name}.ts`, () => {
		var entry = `./src/${PACKAGE.name}.ts`;
		if (fs.existsSync(`./src/${PACKAGE.name}-shim.ts`)) {
			entry = {};
			entry[PACKAGE.name] = `./src/${PACKAGE.name}.ts`;
			entry[PACKAGE.name + '-shim'] = `./src/${PACKAGE.name}-shim.ts`;
		}
		return webpack({
			entry, mode: 'none',
			devtool: process.argv.includes('--sm') ? 'source-map' : undefined,
			module: {
				rules: [{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [{
						loader: 'ts-loader',
						options: { context: process.cwd() }
					}]
				}]
			},
			resolve: { extensions: ['.ts', '.tsx', '.js'] },
			optimization: {
				minimize: process.argv.includes('--min'),
				minimizer: [new TerserPlugin({
					terserOptions: {
						keep_classnames: true,
						keep_fnames: true
					}
				})]
			},
			output: { filename: '[name].js' }
		}).pipe(gulp.dest((output || DIST) + SOURCE));
	});
}

exports.step_buildSourceDev = gulp.series(pdel(DEV_DIST() + SOURCE), buildSource(DEV_DIST()));
exports.step_buildSource = gulp.series(pdel(DIST + SOURCE), buildSource());

function copyDevDistToLocalDist() {
	return gulp.src(DEV_DIST() + SOURCE + GLOB).pipe(gulp.dest(DIST + SOURCE));
}

/**
 * Builds the Typings for the module
 * @param {string} entry 
 * @param {string} outputName 
 * @param {string} destination 
 * @returns 
 */
function generateTypings(entry, outputName, destination) {
	return desc('generating typings for ' + entry, () => gulp.src(entry)
		.pipe(dts())
		.pipe(tabify(4, false))
		.pipe(rename(outputName + '.d.ts'))
		.pipe(replace(/\.js/g, ''))
		.pipe(replace(/declare module ".+" \{\n/g, ''))
		.pipe(replace(/\timport .+\n/g, ''))
		.pipe(replace(/^\}\n?/mg, ''))
		.pipe(replace(/^\t/mg, ''))
		.pipe(replace(/^export (class|interface)/mg, 'declare $1'))
		.pipe(replace(/^export default (class|interface)/mg, 'declare $1'))
		.pipe(replace(/^\tprivate .+\n/mg, ''))
		.pipe(replace(/^export {};\n/mg, ''))
		.pipe(replace(/^declare global \{$(\n.+){5}/m, ''))
		.pipe(gulp.dest(destination)));
}

/**
 * Builds the module manifest based on the package, sources, and css.
 */
function buildManifest(output = null) {
	var files = []; // Collector for all the file paths
	output = output || DIST;
	return desc('build Manifest', (cb) => gulp.src(output + SOURCE + GLOB) // collect the source files
		.pipe(gulp.src(output + CSS + GLOB)) // grab all the CSS files
		.on('data', file => files.push(file.path.replace(file.base, file.base.replace(file.cwd + '/', '')))) // Collect all the file paths
		.on('end', () => { // output the filepaths to the module.json
			if (files.length == 0)
				throw Error('No files found in ' + SOURCE + GLOB + " or " + CSS + GLOB);
			files = files.map(x => x.startsWith(output) ? x.substr(output.length) : x);
			const js = files.filter(e => e.endsWith('js')); // split the CSS and JS files
			const css = files.filter(e => e.endsWith('css'));
			fs.readFile('module.json', (err, data) => {
				const module = data.toString() // Inject the data into the module.json
					.replace('"{{sources}}"', stringify(js, { indent: '\t' }))
					.replace('"{{css}}"', stringify(css, { indent: '\t' }));
				fs.writeFile(output + 'module.json', module, cb); // save the module to the distribution directory
			});
		}));
}
exports.step_buildManifest = buildManifest();

function outputLanguages(output = null) { return desc('output Languages', () => gulp.src(LANG + GLOB).pipe(jsonminify()).pipe(gulp.dest((output || DIST) + LANG))); }
function outputSoundsDir(output = null) { return desc('output Sounds', () => gulp.src(SOUNDS + GLOB).pipe(gulp.dest((output || DIST) + SOUNDS))); }
function outputTemplates(output = null) { return desc('output Templates', () => gulp.src(TEMPLATES + GLOB).pipe(replace(/\t/g, '')).pipe(replace(/\>\n\</g, '><')).pipe(gulp.dest((output || DIST) + TEMPLATES))); }
function outputStylesCSS(output = null) { return desc('output Styles CSS', () => gulp.src(CSS + GLOB).pipe(sass({ outputStyle: process.argv.includes('--min') ? 'compressed' : undefined })).pipe(concat(PACKAGE.name + '.css')).pipe(gulp.dest((output || DIST) + CSS))); }
function outputMetaFiles(output = null) { return desc('output Meta Files', () => gulp.src([LICENSE, 'README.md', 'CHANGELOG.md']).pipe(gulp.dest((output || DIST)))); }
function outputPackFiles(output = null) { return desc('output Meta Files', () => gulp.src(PACKS + GLOB).pipe(gulp.dest((output || DIST) + PACKS))); }
function outputLibraries(output = null) { return desc("output Libs Files", () => gulp.src(LIBS + GLOB).pipe(gulp.dest((output || DIST) + LIBS))); }

/**
 * Copy files to module named directory and then compress that folder into a zip
 */
function compressDistribution() {
	return gulp.series(
		// Copy files to folder with module's name
		() => gulp.src(DIST + GLOB)
			.pipe(gulp.dest(DIST + `${PACKAGE.name}/${PACKAGE.name}`))
		// Compress the new folder into a ZIP and save it to the `bundle` folder
		, () => gulp.src(DIST + PACKAGE.name + '/' + GLOB)
			.pipe(zip(PACKAGE.name + '.zip'))
			.pipe(gulp.dest(BUNDLE))
		// Copy the module.json to the bundle directory
		, () => gulp.src(DIST + '/module.json')
			.pipe(gulp.dest(BUNDLE))
		// Cleanup by deleting the intermediate module named folder
		, pdel(DIST + PACKAGE.name)
	);
}
exports.step_compress = compressDistribution();

/**
 * Simple clean command
 */
exports.clean = gulp.series(pdel([DIST, BUNDLE]));
exports.devClean = gulp.series(pdel([DEV_DIST()]));
/**
 * Default Build operation
 */
exports.default = gulp.series(
	pdel([DIST])
	, gulp.parallel(
		buildSource()
		, outputLanguages()
		, outputSoundsDir()
		, outputTemplates()
		, outputStylesCSS()
		, outputMetaFiles()
		, outputPackFiles()
		, outputLibraries()
	)
	, buildManifest()
	, plog('Build Complete')
	// , pnotify('Default distribution build completed.', 'Build Complete')
);
/**
 * Extends the default build task by copying the result to the Development Environment
 */
exports.dev = gulp.series(
	pdel([DIST + GLOB, DEV_DIST() + GLOB], { force: true }),
	gulp.parallel(
		buildSource(DEV_DIST())
		, outputLanguages(DEV_DIST())
		, outputSoundsDir(DEV_DIST())
		, outputTemplates(DEV_DIST())
		, outputStylesCSS(DEV_DIST())
		, outputMetaFiles(DEV_DIST())
		, outputPackFiles(DEV_DIST())
		, outputLibraries(DEV_DIST())
	)
	, buildManifest(DEV_DIST())
	, copyDevDistToLocalDist
	, pnotify('Development distribution build completed.', 'Dev Build Complete')
);
/**
 * Performs a default build and then zips the result into a bundle
 */
exports.zip = gulp.series(
	pdel([DIST + GLOB, BUNDLE])
	, gulp.parallel(
		buildSource()
		, outputLanguages()
		, outputSoundsDir()
		, outputTemplates()
		, outputStylesCSS()
		, outputMetaFiles()
		, outputPackFiles()
		, outputLibraries()
	)
	, generateTypings(`src/${PACKAGE.name}.ts`, PACKAGE.name, BUNDLE)
	, buildManifest()
	, pwait(10) // <- This is here because GULP is not respecting the series request and executing compressDistribution before buildManifest has finished
	, compressDistribution()
	, pdel([DIST])
	, pnotify('Production Release built and bundled.', 'Release Complete')
);
/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components.
 */
exports.watch = function () {
	exports.default();
	gulp.watch(SOURCE + GLOB, gulp.series(pdel(DIST + SOURCE), buildSource(), pnotify('Default distribution build completed.', 'Build Complete')));
	gulp.watch([CSS + GLOB, 'module.json'], buildManifest());
	gulp.watch(LANG + GLOB, gulp.series(pdel(DIST + LANG), outputLanguages()));
	gulp.watch(SOUNDS + GLOB, gulp.series(pdel(DIST + SOUNDS), outputSoundsDir()));
	gulp.watch(TEMPLATES + GLOB, gulp.series(pdel(DIST + TEMPLATES), outputTemplates()));
	gulp.watch(CSS + GLOB, gulp.series(pdel(DIST + CSS), outputStylesCSS()));
	gulp.watch([LICENSE, 'README.md', 'CHANGELOG.md'], outputMetaFiles());
	gulp.watch(PACKS + GLOB, outputPackFiles());
	gulp.watch(LIBS + GLOB, outputLibraries());
}
/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components, and then copy them to the Development Environment.
 */
exports.devWatch = function () {
	const devDist = DEV_DIST();
	console.log('Dev Directory: ' + devDist);
	exports.dev();
	gulp.watch(SOURCE + GLOB, gulp.series(pdel([devDist + SOURCE + GLOB, DIST + SOURCE + GLOB], { force: true }), buildSource(devDist), copyDevDistToLocalDist, pnotify('Development distribution build completed.', 'Dev Build Complete')));
	gulp.watch([CSS + GLOB, 'module.json'], gulp.series(reloadPackage, buildManifest(devDist), plog('manifest done.')));
	gulp.watch(LANG + GLOB, gulp.series(pdel(devDist + LANG + GLOB, { force: true }), outputLanguages(devDist), plog('langs done.')));
	gulp.watch(SOUNDS + GLOB, gulp.series(pdel(devDist + SOUNDS + GLOB, { force: true }), outputSoundsDir(devDist), plog('sounds done.')));
	gulp.watch(TEMPLATES + GLOB, gulp.series(pdel(devDist + TEMPLATES + GLOB, { force: true }), outputTemplates(devDist), plog('templates done.')));
	gulp.watch(CSS + GLOB, gulp.series(pdel(devDist + CSS + GLOB, { force: true }), outputStylesCSS(devDist), plog('css done.')));
	gulp.watch([LICENSE, 'README.md', 'CHANGELOG.md'], gulp.series(outputMetaFiles(devDist), plog('metas done.')));
	gulp.watch(PACKS + GLOB, gulp.series(outputPackFiles(devDist), plog('compendiums done.')));
	gulp.watch(LIBS + GLOB, gulp.series(outputLibraries(devDist), plog('compendiums done.')));
}
