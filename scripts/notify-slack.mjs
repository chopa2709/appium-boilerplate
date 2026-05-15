import fs from 'fs';
import path from 'path';

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
if (!WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL が設定されていません');
    process.exit(1);
}

// allure-results/ または allure-results-*/ を探す
const candidates = ['allure-results', ...fs.readdirSync('.').filter(f => f.startsWith('allure-results-') && fs.statSync(f).isDirectory())];
const RESULTS_DIR = candidates.find(d => fs.existsSync(d) && fs.readdirSync(d).some(f => f.endsWith('-result.json')));

if (!RESULTS_DIR) {
    console.error('allure-results ディレクトリが見つかりません');
    process.exit(1);
}

const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('-result.json'));

if (files.length === 0) {
    console.error('allure-results に結果ファイルがありません');
    process.exit(1);
}

// 結果を suite 別に集計
const suites = {};
let totalDurationMs = 0;

for (const file of files) {
    const result = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, file), 'utf-8'));
    const suite = result.labels?.find(l => l.name === 'suite')?.value ?? '(不明)';
    const status = result.status ?? 'unknown';
    const duration = result.duration ?? 0;

    if (!suites[suite]) suites[suite] = { passed: 0, total: 0 };
    suites[suite].total++;
    if (status === 'passed') suites[suite].passed++;
    totalDurationMs += duration;
}

const totalPassed = Object.values(suites).reduce((s, v) => s + v.passed, 0);
const totalCount  = Object.values(suites).reduce((s, v) => s + v.total, 0);
const allPassed   = totalPassed === totalCount;

const durationSec = Math.round(totalDurationMs / 1000);
const durationStr = durationSec >= 60
    ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
    : `${durationSec}s`;

const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
const icon = allPassed ? '✅' : '❌';

const lines = Object.entries(suites).map(([suite, { passed, total }]) => {
    const mark = passed === total ? '✅' : '❌';
    return `${mark} ${suite.padEnd(24)} ${passed}/${total} passed`;
});

const text = [
    `${icon} *テスト結果* ${now}`,
    '─'.repeat(36),
    ...lines,
    '─'.repeat(36),
    `合計: ${totalPassed}/${totalCount} passed  ⏱ ${durationStr}`,
].join('\n');

const payload = { text };

const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});

if (res.ok) {
    console.log('Slack に通知しました');
} else {
    console.error('Slack 通知失敗:', res.status, await res.text());
    process.exit(1);
}
