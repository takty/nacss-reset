import path from 'node:path';

import {
	buildSassFile,
	copyFilesFiltered,
	processFiles,
	walk,
	watch,
} from './tasks.mjs';

const SASS_SRC_DIR = './src/sass';
const DIST_CSS_DIR = './dist/css';
const DOCS_DIR     = './docs';
const DOCS_CSS_DIR = './docs/css';

async function buildSass() {
	for await (const srcPath of walk(SASS_SRC_DIR, '.scss')) {
		const relPath = path.relative(SASS_SRC_DIR, srcPath);
		const name    = path.basename(relPath);

		if (path.dirname(relPath) !== '.' || name.startsWith('_')) {
			continue;
		}
		const dstPath = path.join(DIST_CSS_DIR, `${path.parse(name).name}.min.css`);
		await buildSassFile(srcPath, dstPath);
	}
}

async function copyDocCss() {
	await copyFilesFiltered(DIST_CSS_DIR, DOCS_CSS_DIR, (_srcPath, relPath) => path.dirname(relPath) === '.');
}

async function buildDocStyle() {
	await buildSassFile(path.join(DOCS_DIR, 'style.scss'), path.join(DOCS_CSS_DIR, 'style.min.css'));
}

function getTimestamp() {
	const now = new Date();
	return [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join('');
}

async function updateDocTimestamps() {
	const timestamp = getTimestamp();
	await processFiles(DOCS_DIR, DOCS_DIR, (_srcPath, relPath) => path.extname(relPath) === '.html', source => source.replace(/v\d+t/g, `v${timestamp}t`));
}

async function buildDocCss() {
	await buildSass();
	await copyDocCss();
}

async function buildDocs() {
	await buildDocCss();
	await buildDocStyle();
	await updateDocTimestamps();
}

async function runSafely(fn) {
	try {
		await fn();
	} catch (e) {
		console.error(e);
	}
}

const docs = process.argv.includes('--docs');

await runSafely(docs ? buildDocs : buildSass);

if (process.argv.includes('--watch')) {
	if (docs) {
		console.log(`watching: ${SASS_SRC_DIR}, ${DOCS_DIR}/style.scss`);

		watch(SASS_SRC_DIR, '.scss', () => runSafely(async () => {
			await buildDocCss();
			await updateDocTimestamps();
		}));
		watch(DOCS_DIR, 'style.scss', () => runSafely(async () => {
			await buildDocStyle();
			await updateDocTimestamps();
		}));
	} else {
		console.log(`watching: ${SASS_SRC_DIR}`);
		watch(SASS_SRC_DIR, '.scss', () => runSafely(buildSass));
	}
}
