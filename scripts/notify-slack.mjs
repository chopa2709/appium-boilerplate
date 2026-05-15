import fs from 'fs';
import path from 'path';

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
if (!WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL が設定されていません');
    process.exit(1);
}

const ALLURE_URL = process.env.ALLURE_REPORT_URL ?? '';
const PLATFORM   = process.env.PLATFORM ?? '';

// allure-results/ および allure-results-*/ を全て対象にする
const allDirs = ['allure-results', ...fs.readdirSync('.').filter(f => f.startsWith('allure-results-') && fs.statSync(f).isDirectory())];
const resultsDirs = allDirs.filter(d => fs.existsSync(d) && fs.readdirSync(d).some(f => f.endsWith('-result.json')));

if (resultsDirs.length === 0) {
    console.error('allure-results ディレクトリが見つかりません');
    process.exit(1);
}

console.log('読み込むディレクトリ:', resultsDirs);

const files = resultsDirs.flatMap(d =>
    fs.readdirSync(d).filter(f => f.endsWith('-result.json')).map(f => path.join(d, f))
);

if (files.length === 0) {
    console.error('allure-results に結果ファイルがありません');
    process.exit(1);
}

// 結果を suite 別に集計 & デバイス名を取得
const suites = {};
let totalDurationMs = 0;
let deviceName = '';

for (const file of files) {
    const result = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const suite  = result.labels?.find(l => l.name === 'parentSuite')?.value ?? '(不明)';
    const status = result.status ?? 'unknown';
    const duration = (result.stop ?? 0) - (result.start ?? 0);

    if (!deviceName) {
        deviceName = result.labels?.find(l => l.name === 'device_name')?.value ?? '';
    }

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

// プラットフォーム表示
const platformIcon = PLATFORM.toLowerCase() === 'ios' ? '🍎 iOS' : PLATFORM.toLowerCase() === 'android' ? '🤖 Android' : '';
const platformStr  = [platformIcon, deviceName].filter(Boolean).join(' / ');

const lines = Object.entries(suites).map(([suite, { passed, total }]) => {
    const mark = passed === total ? '✅' : '❌';
    return `${mark} ${suite.padEnd(24)} ${passed}/${total} passed`;
});

const footer = ALLURE_URL
    ? `合計: ${totalPassed}/${totalCount} passed  ⏱ ${durationStr}\n📊 <${ALLURE_URL}|Allure レポート>`
    : `合計: ${totalPassed}/${totalCount} passed  ⏱ ${durationStr}`;

const text = [
    `${icon} *テスト結果* ${now}${platformStr ? `  |  ${platformStr}` : ''}`,
    '─'.repeat(36),
    ...lines,
    '─'.repeat(36),
    footer,
].join('\n');

const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
});

if (res.ok) {
    console.log('Slack に通知しました');
} else {
    console.error('Slack 通知失敗:', res.status, await res.text());
    process.exit(1);
}
