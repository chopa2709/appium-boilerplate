import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as baseConfig } from './wdio.shared.conf.js';
import { RtkDeviceService } from './rtk-device.service.js';
import AllureReporter from '@wdio/allure-reporter';

// Remote TestKit は自己署名証明書を使用しているため SSL 検証をスキップ
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RTK_USERNAME    = process.env.RTK_USERNAME    ?? 'ta_trial';
const RTK_ACCESSTOKEN = process.env.RTK_ACCESSTOKEN ?? 'TUX1uwFRt60Y4CZsWPgVSIOjQCgcOksDDSnh40t81bmVhyzGCbvyo5F2AGa2sz9M';

export const config: WebdriverIO.Config = {
    ...baseConfig,

    hostname: 'rtk-ap001.dh-testing.com',
    port: 443,
    protocol: 'https',
    path: '/wd/hub',

    reporters: [
        'spec',
        ['allure', { outputDir: `allure-results-ios-${Date.now()}` }],
    ],

    baseUrl: 'https://hotel-example-site.takeyaqa.dev/ja/',

    specs: ['../tests/specs/**/hotel.*.spec.ts'],

    services: [
        [RtkDeviceService, {
            username:     RTK_USERNAME,
            accessToken:  RTK_ACCESSTOKEN,
            baseUrl:      'https://rtk-ap001.dh-testing.com',
            os:           'IOS',
            priorityFile: join(__dirname, 'rtk-devices.ios.json'),
        }] as any,
    ],

    // validateCapabilities は node_modules/webdriver/build/node.js にパッチ済み:
    // accessToken / userName / password を W3C バリデーション対象外に除外している
    // appium:deviceName / platformVersion / udid は RtkDeviceService が onPrepare で設定する
    before: async (_capabilities, _specs, browser) => {
        const cap = browser.capabilities as Record<string, unknown>;
        const deviceName = (cap['appium:deviceName'] ?? cap['deviceName']) as string | undefined;
        if (deviceName) {
            AllureReporter.addLabel('device_name', deviceName);
        }
    },

    capabilities: [
        {
            platformName: 'iOS',
            browserName: 'Safari',
            'wdio:maxInstances': 1,
            'appium:automationName': 'XCUITest',
            'appium:newCommandTimeout': 240,
            accessToken: RTK_ACCESSTOKEN,
        } as WebdriverIO.Capabilities,
    ],
};
