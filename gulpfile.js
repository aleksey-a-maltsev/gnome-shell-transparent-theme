const {dest, series, src} = require('gulp');
const gulpif = require('gulp-if');
const sass = require('gulp-sass');
const glob = require('glob');
const through = require('through2');
const {join, dirname} = require('path');
const fsConstants = require('fs').constants;
const fs = require('fs').promises;
const {rmdir} = require('./lib/file');

const logger = console;

const SOURCE = 'src';
const OUTPUT = 'out';
const ASSETS_EXT = ['svg', 'png', 'jpg', 'css'];
const THEME_DIR = 'gnome-shell';
const THEME_CONFIG = 'theme.json';

function emptyStream() {
	return through((chunk, enc, callback) => {
		callback();
	});
}

async function getConfig(fileName) {
	let config;
	try {
		await fs.access(fileName, fsConstants.F_OK);
	} catch (err) {
		return {};
	}

	config = JSON.parse(await fs.readFile(fileName, 'utf8'));
	return config || {};
}

async function getThemeConfig(path) {
	const configFile = join(path, THEME_CONFIG);
	const src = dirname(configFile);
	const dest = join(OUTPUT, src.substr(SOURCE.length));
	const config = await getConfig(configFile);

	const ext = config.extends ?
		await getThemeConfig(join(SOURCE, config.extends, THEME_DIR)) :
		null;

	return {src, dest, config, extends: ext};
}

async function getThemes() {
	return new Promise((resolve, reject) => {
		glob(join(SOURCE, '**', THEME_DIR), (err, paths) => {
			if (err) {
				reject(err);
			}
			Promise.all(paths.map(async (path) => await getThemeConfig(path)))
				.then(resolve)
				.catch(reject);

		});
	});
}

function isExtendedTheme(theme) {
	return !!theme.extends;
}

function compileTheme(theme) {
	return src(`${theme.src}/**/*.scss`)
		.pipe(sass().on('error', sass.logError));
}

function copyThemeAssets(theme) {
	if (!theme) {
		return emptyStream();
	}
	return src(ASSETS_EXT.map((ext) => `${theme.src}/**/*.${ext}`));
}

function processTheme(theme) {
	logger.log(`Processing theme "${theme.src}"`);

	return compileTheme(theme)
		.pipe(copyThemeAssets(theme))
		.pipe(gulpif(isExtendedTheme(theme), copyThemeAssets(theme.extends)))
		.pipe(dest(theme.dest));
}

async function processThemes() {
	const themes = await getThemes();
	themes.forEach((theme) => {
		processTheme(theme);
	});
}

async function clean() {
	logger.log(`Cleaning "${OUTPUT}"`);
	await rmdir(OUTPUT);
}

exports.default = series(clean, processThemes);
