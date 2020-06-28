const {dest, series, src} = require('gulp');
const sass = require('gulp-sass');
const {exec} = require('child_process');

const SOURCE = 'src';
const OUTPUT = 'out';
const ASSETS_EXT = ['svg', '.png', 'css'];

function copyAssetsTask() {
	return src(ASSETS_EXT.map((ext) => `${SOURCE}/**/*.${ext}`))
		.pipe(dest(OUTPUT));
}

function compileThemeTask() {
	const themeName = 'Gnome-dark-transparent';
	//return exec(`npx sass ${SOURCE}/${themeName}/gnome-shell.scss {OUTPUT}/${themeName}/gnome-shell.css`);

	return src(`${SOURCE}/**/*.scss`)
		.pipe(sass().on('error', sass.logError))
		.pipe(dest(`${OUTPUT}`));
}

exports.default = series(
	compileThemeTask,
	copyAssetsTask
);
