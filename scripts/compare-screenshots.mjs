/**
 * 2つの allure-results-ios-* ディレクトリを比較し、
 * スクリーンショットを左右に並べた HTML を生成する。
 *
 * 使い方:
 *   node scripts/compare-screenshots.mjs [前回ディレクトリ] [今回ディレクトリ]
 *   node scripts/compare-screenshots.mjs   # 引数なしで最新2件を自動検出
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── ディレクトリ解決 ──────────────────────────────────────────────────────────

function findRecentDirs() {
    const entries = readdirSync(ROOT, { withFileTypes: true });
    return entries
        .filter(e => e.isDirectory() && e.name.startsWith('allure-results-ios-'))
        .map(e => e.name)
        .sort();
}

const [arg1, arg2] = process.argv.slice(2);
let prevDir, currDir;

if (arg1 && arg2) {
    prevDir = resolve(arg1);
    currDir = resolve(arg2);
} else {
    const dirs = findRecentDirs();
    if (dirs.length < 2) {
        console.error('allure-results-ios-* ディレクトリが2つ以上必要です');
        process.exit(1);
    }
    prevDir = join(ROOT, dirs[dirs.length - 2]);
    currDir = join(ROOT, dirs[dirs.length - 1]);
}

console.log('前回:', prevDir);
console.log('今回:', currDir);

// ── Allure results パース ─────────────────────────────────────────────────────

function walkSteps(steps, screenshots) {
    for (const step of steps) {
        // status がなく PNG アタッチメントを持つステップ = カスタムスクリーンショット
        if (!step.status && step.attachments) {
            for (const att of step.attachments) {
                if (att.type === 'image/png') {
                    screenshots.push({ label: step.name, source: att.source });
                }
            }
        }
        if (step.steps?.length) walkSteps(step.steps, screenshots);
    }
}

function parseResults(dir) {
    const files = readdirSync(dir).filter(f => f.endsWith('-result.json'));
    const results = [];

    for (const file of files) {
        const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
        const screenshots = [];
        walkSteps(data.steps ?? [], screenshots);
        if (screenshots.length > 0) {
            results.push({ testName: data.name, screenshots });
        }
    }
    return results;
}

function toBase64(dir, source) {
    try {
        const buf = readFileSync(join(dir, source));
        return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
        return null;
    }
}

const prevResults = parseResults(prevDir);
const currResults = parseResults(currDir);

// ── HTML 生成 ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildTestSection(testName, prevScreenshots, currScreenshots) {
    const allLabels = [
        ...new Set([
            ...(prevScreenshots?.map(s => s.label) ?? []),
            ...(currScreenshots?.map(s => s.label) ?? []),
        ]),
    ];

    const rows = allLabels.map(label => {
        const prevShot = prevScreenshots?.find(s => s.label === label);
        const currShot = currScreenshots?.find(s => s.label === label);

        const prevImg = prevShot ? toBase64(prevDir, prevShot.source) : null;
        const currImg = currShot ? toBase64(currDir, currShot.source) : null;

        const prevCell = prevImg
            ? `<img src="${prevImg}" alt="${escapeHtml(label)}">`
            : `<div class="missing">（なし）</div>`;
        const currCell = currImg
            ? `<img src="${currImg}" alt="${escapeHtml(label)}">`
            : `<div class="missing">（なし）</div>`;

        return `
        <tr>
          <td class="label">${escapeHtml(label)}</td>
          <td class="shot">${prevCell}</td>
          <td class="shot">${currCell}</td>
        </tr>`;
    }).join('');

    return `
  <section>
    <h2>${escapeHtml(testName)}</h2>
    <table>
      <thead>
        <tr>
          <th class="label">ステップ</th>
          <th>前回</th>
          <th>今回</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
  </section>`;
}

const allTestNames = [
    ...new Set([
        ...prevResults.map(r => r.testName),
        ...currResults.map(r => r.testName),
    ]),
];

const sections = allTestNames.map(name => {
    const prev = prevResults.find(r => r.testName === name);
    const curr = currResults.find(r => r.testName === name);
    return buildTestSection(name, prev?.screenshots, curr?.screenshots);
}).join('\n');

const prevDirName = prevDir.split(/[\\/]/).pop();
const currDirName = currDir.split(/[\\/]/).pop();

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>スクリーンショット比較</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #f5f5f5; padding: 24px; }
    h1 { font-size: 1.4rem; margin-bottom: 8px; }
    .meta { font-size: 0.85rem; color: #666; margin-bottom: 32px; }
    .meta span { display: inline-block; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
    .prev-label { background: #dbeafe; color: #1e40af; }
    .curr-label { background: #dcfce7; color: #166534; }
    section { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 28px;
              box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    h2 { font-size: 1rem; margin-bottom: 16px; padding-bottom: 8px;
         border-bottom: 2px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-size: 0.8rem; color: #374151;
         border-bottom: 1px solid #e5e7eb; }
    th:nth-child(2) { background: #eff6ff; color: #1d4ed8; }
    th:nth-child(3) { background: #f0fdf4; color: #15803d; }
    td.label { font-size: 0.8rem; color: #6b7280; white-space: nowrap;
               width: 140px; border-right: 1px solid #f3f4f6; }
    td.shot { width: calc((100% - 140px) / 2); padding: 6px; }
    td.shot img { width: 100%; height: auto; border-radius: 4px;
                  border: 1px solid #e5e7eb; display: block; }
    .missing { font-size: 0.8rem; color: #9ca3af; padding: 20px;
               text-align: center; border: 1px dashed #d1d5db; border-radius: 4px; }
    tr:hover td { background: #fafafa; }
  </style>
</head>
<body>
  <h1>スクリーンショット比較</h1>
  <p class="meta">
    <span class="prev-label">前回: ${escapeHtml(prevDirName)}</span>
    <span class="curr-label">今回: ${escapeHtml(currDirName)}</span>
  </p>
  ${sections}
</body>
</html>`;

const outPath = join(ROOT, 'screenshot-diff.html');
writeFileSync(outPath, html, 'utf8');
console.log('生成完了:', outPath);
