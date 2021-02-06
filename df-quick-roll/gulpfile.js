const gulp = require('gulp');
var fs = require('fs')
const del = require('del');
const ts = require('gulp-typescript');
const sm = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const rename = require('gulp-rename');

const GLOB = '**/*';
const DIST = 'dist/';
const BUNDLE = 'bundle/';
const SOURCE = 'src/';
const LANG = 'lang/';
const TEMPLATES = 'templates/';
const CSS = 'css/';

var PACKAGE = JSON.parse(fs.readFileSync('./package.json'));
function reloadPackage(cb) { PACKAGE = JSON.parse(fs.readFileSync('./package.json')); cb(); }
function DEV_DIST() { return PACKAGE.devDir + PACKAGE.name + '/'; }

String.prototype.replaceAll = function (pattern, replace) { return this.split(pattern).join(replace); }
function pdel(patterns, options) { return () => { return del(patterns, options); }; }
function plog(message) { return (cb) => { console.log(message); cb() }; }


/**
 * Compile the source code into the distribution directory
 * @param {Boolean} keepSources Include the TypeScript SourceMaps
 */
function buildSource(keepSources) {
	var stream = gulp.src(SOURCE + GLOB);
	if (keepSources) stream = stream.pipe(sm.init())
	stream = stream.pipe(ts.createProject("tsconfig.json")())
	if (keepSources) stream = stream.pipe(sm.write())
	return () => stream.pipe(gulp.dest(DIST + SOURCE));
}
exports.step_buildSourceDev = buildSource(true);
exports.step_buildSource = buildSource(false);

/**
 * Builds the module manifest based on the package, sources, and css.
 * @param {String} Release Release name override.
 */
function buildManifest(release = null) {
	const files = []; // Collector for all the file paths
	return (cb) => gulp.src(SOURCE + GLOB) // collect the source files
		.pipe(rename({ extname: '.js' })) // rename their extensions to `.js`
		.pipe(gulp.src(CSS + GLOB)) // grab all the CSS files
		.on('data', file => files.push(file.path.replace(file.base, file.base.replace(file.cwd + '/', '')))) // Collect all the file paths
		.on('end', () => { // output the filepaths to the module.json
			if (files.length == 0)
				throw Error('No files found in ' + SOURCE + GLOB + " or " + CSS + GLOB);
			const js = files.filter(e => e.endsWith('js')); // split the CSS and JS files
			const css = files.filter(e => e.endsWith('css'));
			fs.readFile('module.json', (err, data) => {
				const module = data.toString() // Inject the data into the module.json
					.replaceAll('{{name}}', PACKAGE.name)
					.replaceAll('{{version}}', PACKAGE.version)
					.replaceAll('{{release}}', release || PACKAGE.version)
					.replace('"{{sources}}"', JSON.stringify(js, null, '\t').replaceAll('\n', '\n\t'))
					.replace('"{{css}}"', JSON.stringify(css, null, '\t').replaceAll('\n', '\n\t'));
				fs.writeFile(DIST + 'module.json', module, cb); // save the module to the distribution directory
			});
		});
}
exports.step_buildManifest = buildManifest();

const outputLanguages = () => gulp.src(LANG + GLOB).pipe(gulp.dest(DIST + LANG));
const outputTemplates = () => gulp.src(TEMPLATES + GLOB).pipe(gulp.dest(DIST + TEMPLATES));
const outputStylesCSS = () => gulp.src(CSS + GLOB).pipe(gulp.dest(DIST + CSS));
const outputMetaFiles = () => gulp.src(['LICENSE', 'README.md', 'CHANGELOG.md']).pipe(gulp.dest(DIST));

/**
 * Copy files to module named directory and then compress that folder into a zip
 * @param {String} Release Release name override.
 */
function compressDistribution(release = null) {
	return gulp.series(
		// Copy files to folder with module's name
		() => gulp.src(DIST + GLOB)
			.pipe(gulp.dest(DIST + `${PACKAGE.name}/${PACKAGE.name}`))
		// Compress the new folder into a ZIP and save it to the `bundle` folder
		, () => gulp.src(DIST + PACKAGE.name + '/' + GLOB)
			.pipe(zip(PACKAGE.name + '.zip'))
			.pipe(gulp.dest(BUNDLE))
		// Copy the module.json to the bundle directory, renaming it for the release
		, () => gulp.src(DIST + '/module.json')
			.pipe(rename(`module.json`))
			.pipe(gulp.dest(BUNDLE))
		// Cleanup by deleting the intermediate module named folder
		, pdel(DIST + PACKAGE.name)
	);
}
exports.step_buildManifest = compressDistribution();

/**
 * Outputs the current distribution folder to the Development Environment.
 */
function outputDistToDevEnvironment() {
	return gulp.src(DIST + GLOB).pipe(gulp.dest(PACKAGE.devDir + PACKAGE.name));
}
exports.step_outputDistToDevEnvironment = outputDistToDevEnvironment;

/**
 * Simple clean command
 */
exports.clean = pdel([DIST, BUNDLE]);
/**
 * Default Build operation
 */
exports.default = gulp.series(
	pdel([DIST])
	, gulp.parallel(
		buildSource(true)
		, buildManifest()
		, outputLanguages
		// , outputTemplates
		// , outputStylesCSS
		, outputMetaFiles
	)
);
/**
 * Extends the default build task by copying the result to the Development Environment
 */
exports.dev = gulp.series(
	gulp.parallel(
		pdel([DEV_DIST() + GLOB], { force: true })
		, exports.default
	)
	, outputDistToDevEnvironment
);
/**
 * Performs a default build and then zips the result into a bindle using `latest` as the release name
 */
exports.zip = gulp.series(
	pdel([DIST])
	, gulp.parallel(
		buildSource(false)
		, buildManifest()
		, outputLanguages
		// , outputTemplates
		// , outputStylesCSS
		, outputMetaFiles
	)
	, compressDistribution()
);
/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components.
 */
exports.watch = function () {
	exports.default();
	gulp.watch(SOURCE + GLOB, gulp.series(pdel(DIST + SOURCE), buildSource(true)));
	gulp.watch(['module.json', 'package.json'], buildManifest());
	gulp.watch(LANG + GLOB, gulp.series(pdel(LANG + SOURCE), outputLanguages));
	// gulp.watch(TEMPLATES + GLOB, gulp.series(pdel(TEMPLATES + SOURCE), outputTemplates));
	// gulp.watch(CSS + GLOB, gulp.series(pdel(CSS + SOURCE), outputStylesCSS));
	gulp.watch(['LICENSE', 'README.md', 'CHANGELOG.md'], outputMetaFiles);
}
/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components, and then copy them to the Development Environment.
 */
exports.devWatch = function () {
	exports.dev();
	gulp.watch(SOURCE + GLOB, gulp.series(pdel(DIST + SOURCE), buildSource(true), outputDistToDevEnvironment));
	gulp.watch(['module.json', 'package.json'], gulp.series(reloadPackage, buildManifest(), outputDistToDevEnvironment));
	gulp.watch(LANG + GLOB, gulp.series(pdel(LANG + SOURCE), outputLanguages, outputDistToDevEnvironment));
	// gulp.watch(TEMPLATES + GLOB, gulp.series(pdel(TEMPLATES + SOURCE), outputTemplates, outputDistToDevEnvironment));
	// gulp.watch(CSS + GLOB, gulp.series(pdel(CSS + SOURCE), outputStylesCSS, outputDistToDevEnvironment));
	gulp.watch(['LICENSE', 'README.md', 'CHANGELOG.md'], gulp.series(outputMetaFiles, outputDistToDevEnvironment));
}
