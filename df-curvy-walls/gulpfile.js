const { watch, parallel, series, src, dest } = require('gulp');
var fs = require('fs')
const _del = require('del');
const ts = require('gulp-typescript');
const sm = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const rename = require('gulp-rename');

const GLOB = '**/*';
const DIST = 'dist/';
const SOURCE = 'src/';
const LANG = 'lang/';
const TEMPLATES = 'templates/';
const CSS = 'css/';

String.prototype.replaceAll = function (pattern, replace) {
	return this.split(pattern).join(replace);
}
function npmPackage() { return JSON.parse(fs.readFileSync('./package.json')); }

function del(patterns, options) { return () => { return _del(patterns, options); }; }
function plog(message) { return (cb) => { console.log(message); cb() }; }

// Sets the version to the one present in package.json and injects the current list of sources
function processModuleManifest(cb) {
	const files = [];
	src(SOURCE + GLOB)
		.pipe(rename({ extname: '.js' }))
		.pipe(src(CSS + GLOB))
		.on('data', file => files.push(file.path.replace(file.base, file.base.replace(file.cwd + '/', ''))))
		.on('end', () => {
			if (files.length == 0)
				throw Error('No files found in ' + SOURCE + GLOB + " or " + CSS + GLOB);
			const js = files.filter(e => e.endsWith('js'));
			const css = files.filter(e => e.endsWith('css'));
			fs.readFile('module.json', (err, data) => {
				const module = data.toString()
					.replace('{{name}}', npmPackage().name)
					.replaceAll('{{version}}', npmPackage().version)
					.replace('"{{sources}}"', JSON.stringify(js, null, '\t').replaceAll('\n', '\n\t'))
					.replace('"{{css}}"', JSON.stringify(css, null, '\t').replaceAll('\n', '\n\t'));
				fs.writeFile(DIST + 'module.json', module, cb);
				// cb();
			});
		});
}

function build() {
	return src(SOURCE + GLOB)
		.pipe(sm.init())
		.pipe(ts.createProject("tsconfig.json")())
		.pipe(sm.write())
		.pipe(dest(DIST + SOURCE));
}
function devOutput() {
	return src(DIST + GLOB).pipe(dest(npmPackage().devDir));
}

function bundleCompile() {
	return src(SOURCE + GLOB)
		.pipe(ts.createProject("tsconfig.json")())
		.pipe(dest(DIST + SOURCE));
}
function bundleZip() {
	const package = npmPackage();
	return src(package.name + '/' + GLOB)
		.pipe(zip(`${package.name}_${package.version}.zip`))
		.pipe(dest('./'));
}
const outputAssets = parallel(
	() => src(LANG + GLOB).pipe(dest(DIST + LANG)),
	() => src(TEMPLATES + GLOB).pipe(dest(DIST + TEMPLATES)),
	() => src(CSS + GLOB).pipe(dest(DIST + CSS)),
	() => src(['LICENSE', 'README.md', 'CHANGELOG.md']).pipe(dest(DIST))
);


exports.clean = del([DIST]);
exports.devClean = function () {
	const package = npmPackage();
	return _del([DIST, package.devDir + SOURCE, package.devDir + LANG, package.devDir + 'module.json'], { force: true });
}

exports.bundle = (() => {
	const package = npmPackage();
	return series(
		exports.clean
		, parallel(outputAssets, series(bundleCompile, processModuleManifest))
		, () => src(DIST + GLOB).pipe(dest(`${package.name}/${package.name}`))
		, bundleZip
		, del([DIST, package.name])
	);
})();

exports.build = series(outputAssets, build, processModuleManifest);
exports.module = processModuleManifest;
exports.assets = outputAssets;
exports.default = series(exports.clean, exports.build);
exports.dev = series(exports.devClean, exports.build, devOutput);

exports.watch = function () {
	exports.default();
	watch(SOURCE + GLOB, series(del(DIST + SOURCE), build));
	watch(LANG + GLOB, series(del(DIST + LANG + GLOB), outputAssets));
	watch(['module.json', 'package.json'], series(
		del(DIST + 'module.json'),
		cb => { npmPackage = JSON.parse(fs.readFileSync('./package.json')); cb(); },
		processModuleManifest
	));
}
exports.devWatch = function () {
	series(exports.dev, plog("Ready!"))();
	watch([
		SOURCE + GLOB,
		LANG + GLOB,
		TEMPLATES + GLOB,
		CSS + GLOB,
		'module.json',
		'package.json'],
		series(exports.dev, plog("Ready!"))
	);

	// watch(SOURCE + GLOB, series(del(DIST + SOURCE), build, devOutput));
	// watch(LANG + GLOB, series(del(DIST + LANG), outputAssets, devOutput));
	// watch(['module.json', 'package.json'], series(
	// 	del(DIST + 'module.json'),
	// 	cb => { npmPackage = JSON.parse(fs.readFileSync('./package.json')); cb(); },
	// 	processModuleManifest, devOutput
	// ));
}