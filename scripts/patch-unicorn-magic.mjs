/**
 * unicorn-magic の ESM-only な "./node" export に CJS require 条件を追加するパッチスクリプト。
 *
 * tsx が CJS シムとして動作するとき、`import {toPath} from 'unicorn-magic/node'` を
 * CJS require に変換するが、unicorn-magic v0.3.x/v0.4.x には "require" 条件がないため
 * ERR_PACKAGE_PATH_NOT_EXPORTED が発生する。postinstall でこのスクリプトを実行して修正する。
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NODE_MODULES = join(ROOT, 'node_modules');

const NODE_CJS_CONTENT = `'use strict';
const path = require('node:path');
const {fileURLToPath} = require('node:url');
const {execFileSync: execFileSyncOriginal, execFile: execFileCallback} = require('node:child_process');
const {promisify} = require('node:util');

const execFileOriginal = promisify(execFileCallback);
const TEN_MEGABYTES_IN_BYTES = 10 * 1024 * 1024;

function toPath(urlOrPath) {
    return urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}

function rootDirectory(pathInput) {
    return path.parse(toPath(pathInput)).root;
}

function traversePathUp(startPath) {
    return {
        *[Symbol.iterator]() {
            let currentPath = path.resolve(toPath(startPath));
            let previousPath;
            while (previousPath !== currentPath) {
                yield currentPath;
                previousPath = currentPath;
                currentPath = path.resolve(currentPath, '..');
            }
        },
    };
}

async function execFile(file, arguments_, options = {}) {
    return execFileOriginal(file, arguments_, {maxBuffer: TEN_MEGABYTES_IN_BYTES, ...options});
}

function execFileSync(file, arguments_ = [], options = {}) {
    return execFileSyncOriginal(file, arguments_, {maxBuffer: TEN_MEGABYTES_IN_BYTES, encoding: 'utf8', stdio: 'pipe', ...options});
}

async function delay({seconds, milliseconds} = {}) {
    let duration;
    if (typeof seconds === 'number') {
        duration = seconds * 1000;
    } else if (typeof milliseconds === 'number') {
        duration = milliseconds;
    } else {
        throw new TypeError('Expected an object with either \`seconds\` or \`milliseconds\`.');
    }
    return new Promise(resolve => { setTimeout(resolve, duration); });
}

module.exports = {toPath, rootDirectory, traversePathUp, execFile, execFileSync, delay};
`;

/**
 * node_modules ディレクトリを起点に unicorn-magic の全インストール先を列挙する。
 * 探索パターン: node_modules/{pkg}/node_modules/{pkg}/... を再帰的に辿る。
 */
function* findInNodeModules(nmDir, depth = 0) {
    if (depth > 5) return;
    let entries;
    try {
        entries = readdirSync(nmDir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const fullPath = join(nmDir, entry.name);

        if (entry.name === 'unicorn-magic') {
            yield fullPath;
            // unicorn-magic 自身の配下には同パッケージはないのでそこでは終了
        } else if (entry.name.startsWith('@')) {
            // スコープ名前空間: @appium/support など
            let scopedEntries;
            try { scopedEntries = readdirSync(fullPath, { withFileTypes: true }); }
            catch { continue; }
            for (const se of scopedEntries) {
                if (!se.isDirectory()) continue;
                yield* findInNodeModules(join(fullPath, se.name, 'node_modules'), depth + 1);
            }
        } else {
            // 通常パッケージ: 配下の node_modules を探索
            yield* findInNodeModules(join(fullPath, 'node_modules'), depth + 1);
        }
    }
}

let patchedCount = 0;

for (const pkgDir of findInNodeModules(NODE_MODULES)) {
    const pkgJsonPath = join(pkgDir, 'package.json');
    const nodeCjsPath = join(pkgDir, 'node.cjs');

    if (!existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    if (!pkg.exports) continue;

    const nodeExport = pkg.exports['./node'];
    if (!nodeExport) continue;
    if (nodeExport.require) continue; // already patched

    // require 条件を追加
    if (typeof nodeExport === 'string') {
        pkg.exports['./node'] = { require: './node.cjs', import: nodeExport };
    } else {
        pkg.exports['./node'] = { require: './node.cjs', ...nodeExport };
    }

    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, '\t') + '\n', 'utf8');

    if (!existsSync(nodeCjsPath)) {
        writeFileSync(nodeCjsPath, NODE_CJS_CONTENT, 'utf8');
    }

    console.log(`patched: ${pkgDir.replace(ROOT, '.')}`);
    patchedCount++;
}

if (patchedCount === 0) {
    console.log('unicorn-magic: no patches needed');
} else {
    console.log(`unicorn-magic: ${patchedCount} instance(s) patched`);
}
