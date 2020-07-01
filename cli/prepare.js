const {parse, join, resolve} = require('path');
const {copy, download, mkdir, remove, rmdir, unzip} = require('../lib/file');

const manualDependencies = require('../package.json').manualDependencies || {};
const TEMP_DIR = '.temp';

async function processDependency(url, tempFile, innerPath, targetPath) {
	console.log(`Downloading "${url}" to "${tempFile}"`);

	await remove(tempFile);
	await download(url, tempFile);

	const tempParts = parse(tempFile);
	const tempPath = tempParts.dir;
	console.log(`Unzipping "${tempFile}" to "${tempPath}"`);
	await unzip(tempFile, resolve(tempPath));

	console.log(`Removing "${targetPath}"`);
	await rmdir(targetPath);

	const sourcePath = join(tempPath, innerPath);
	console.log(`Copying "${sourcePath}" to "${targetPath}"`);
	await mkdir(targetPath);
	await copy(sourcePath, targetPath);

	console.log(`URL "${url}" processed sucessfully`);
}

console.log('Processing manual dependencies');

for (const [targetPath, {url, path}] of Object.entries(manualDependencies)) {
	const parsedUrl = new URL(url);
	const parsedPathName = parse(parsedUrl.pathname);
	const tempFile = join(TEMP_DIR, parsedPathName.base);
	processDependency(url, tempFile, path, targetPath).catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
