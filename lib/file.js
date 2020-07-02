/**
 * File utils
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const fx = require('mkdir-recursive');
const extract = require('extract-zip')
const copydir = require('copy-dir');
const {parse} = require('path');

function copy(source, target) {
	return new Promise((resolve, reject) => {
		copydir(source, target, {
			utimes: true,
			mode: true,
		  }, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		  });
	});
}

function download(url, fileName) {
	const onError = (file) => {
		file.close();
		fs.unlink(fileName, () => {});
	}

	return new Promise((resolve, reject) => {
		const fileParts = parse(fileName);

		mkdir(fileParts.dir).then(() => {
			const file = fs.createWriteStream(fileName, {
				flags: 'wx'
			});
			let fileError;

			file.on('finish', () => {
				if (!fileError) {
					resolve(file);
				}
			}).on('error', (err) => {
				fileError = err;

				if (err.code === 'EEXIST') {
					file.close();
					reject(new Error(`File "${fileName}" already exists`));
				} else {
					onError(file);
					reject(err.message);
				}
			});

			const logProgress = (downloadedSize, totalSize) => {
				let sizePart;
				if (totalSize > 0) {
					sizePart = `${Math.round(100 * downloadedSize / totalSize)} %`;
				} else {
					sizePart = `${downloadedSize} bytes`;
				}
				console.log(`Downloaded ${sizePart} of "${url}"`);
			};

			const transport = url.startsWith('https:') ? https : http;
			transport.get(url, (response) => {
				if (response.statusCode === 200) {
					const totalSize = response.headers && Number(response.headers['content-length']);
					let downloadedSize = 0;
					response.on('data', (data) => {
						downloadedSize += String(data).length;
						logProgress(downloadedSize, totalSize);
					});
					response.pipe(file);
					return;
				}

				onError(file);
				reject(new Error(`Cannot fetch "${url}" because server responded with ${response.statusCode}: ${response.statusMessage}`));
			}).on('error', (err) => {
				onError(file);
				reject(err);
			});
		}).catch(reject);
	});
}

function exists(fileName) {
	return new Promise((resolve) => {
		fs.access(fileName, fs.constants.F_OK, (err) => {
			resolve(err ? false : true);
		});
	});
}

function mkdir(name) {
	return new Promise((resolve, reject) => {
		fx.mkdir(name, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}

function remove(fileName) {
	return new Promise((resolve, reject) => {
		exists(fileName).then((fileExists) => {
			if (!fileExists) {
				// File does not exist
				resolve();
				return;
			}

			fs.unlink(fileName, (err) => {
				if (err) {
					// File access error
					reject(err);
					return;
				}

				resolve();
			});
		}).catch(reject);
	});
}

function rename(source, target) {
	return new Promise((resolve, reject) => {
		fs.rename(source, target, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}

function rmdir(name) {
	return new Promise((resolve, reject) => {
		fs.rmdir(name, {recursive: true}, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}

async function unzip(fileName, target) {
	await extract(fileName, {dir: target})
}

module.exports = {
	copy,
	download,
	exists,
	mkdir,
	remove,
	rename,
	rmdir,
	unzip
};
