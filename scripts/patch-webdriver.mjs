/**
 * webdriver パッケージへのパッチスクリプト。postinstall で実行される。
 *
 * 【パッチ1: validateCapabilities】
 *   Remote TestKit は W3C 非準拠の bare キー（accessToken / userName / password）を
 *   Capability として要求する。WebdriverIO v9 の validateCapabilities はベンダープレフィックスなし
 *   かつ非標準の Cap をエラー扱いするため、これらを除外リストに加える。
 *
 * 【パッチ2: undici Agent TLS】
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 を設定しても undici の Agent には反映されない。
 *   env var を読んで Agent / ProxyAgent の connect オプションに rejectUnauthorized: false を
 *   明示的に渡すことで、自己署名証明書を持つ RTK サーバーへの接続を可能にする。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'node_modules', 'webdriver', 'build', 'node.js');

if (!existsSync(TARGET)) {
    console.log('patch-webdriver: webdriver/build/node.js not found, skipping');
    process.exit(0);
}

let src = readFileSync(TARGET, 'utf8');
let patched = false;

// ── パッチ1: validateCapabilities ─────────────────────────────────────────
const VALIDATE_BEFORE = `const invalidWebDriverCaps = Object.keys(capabilities).filter((cap) => !CAPABILITY_KEYS.includes(cap) && !cap.includes(":"));`;
const VALIDATE_AFTER  = `const invalidWebDriverCaps = Object.keys(capabilities).filter((cap) => !CAPABILITY_KEYS.includes(cap) && !cap.includes(":") && cap !== "accessToken" && cap !== "userName" && cap !== "password");`;

if (src.includes(VALIDATE_BEFORE)) {
    src = src.replace(VALIDATE_BEFORE, VALIDATE_AFTER);
    patched = true;
    console.log('patch-webdriver: validateCapabilities patched');
} else if (src.includes(VALIDATE_AFTER)) {
    console.log('patch-webdriver: validateCapabilities already patched');
} else {
    console.warn('patch-webdriver: validateCapabilities target not found, skipping');
}

// ── パッチ2: undici Agent TLS ─────────────────────────────────────────────
const TLS_BEFORE = `const dispatcher = shouldUseProxy ? new ProxyAgent({
      uri: PROXY_URL,
      connectTimeout: options.connectionRetryTimeout,
      headersTimeout: options.connectionRetryTimeout,
      bodyTimeout: options.connectionRetryTimeout
    }) : new Agent({
      connectTimeout: options.connectionRetryTimeout,
      headersTimeout: options.connectionRetryTimeout,
      bodyTimeout: options.connectionRetryTimeout
    });`;

const TLS_AFTER = `const tlsConnect = process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" ? { rejectUnauthorized: false } : {};
    const dispatcher = shouldUseProxy ? new ProxyAgent({
      uri: PROXY_URL,
      connectTimeout: options.connectionRetryTimeout,
      headersTimeout: options.connectionRetryTimeout,
      bodyTimeout: options.connectionRetryTimeout,
      connect: tlsConnect
    }) : new Agent({
      connectTimeout: options.connectionRetryTimeout,
      headersTimeout: options.connectionRetryTimeout,
      bodyTimeout: options.connectionRetryTimeout,
      connect: tlsConnect
    });`;

if (src.includes(TLS_BEFORE)) {
    src = src.replace(TLS_BEFORE, TLS_AFTER);
    patched = true;
    console.log('patch-webdriver: undici TLS patched');
} else if (src.includes(TLS_AFTER)) {
    console.log('patch-webdriver: undici TLS already patched');
} else {
    console.warn('patch-webdriver: undici TLS target not found, skipping');
}

if (patched) {
    writeFileSync(TARGET, src, 'utf8');
}
