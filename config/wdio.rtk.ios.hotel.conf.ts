import { config as baseConfig } from './wdio.shared.conf.js';

// Remote TestKit は自己署名証明書を使用しているため SSL 検証をスキップ
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

    // validateCapabilities は node_modules/webdriver/build/node.js にパッチ済み:
    // accessToken / userName / password を W3C バリデーション対象外に除外している
    capabilities: [
        {
            platformName: 'iOS',
            browserName: 'Safari',
            'wdio:maxInstances': 1,
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone 11',
            'appium:platformVersion': '18.5',
            'appium:udid': '00008030-000A74EA3A80802E',
            'appium:newCommandTimeout': 240,
            accessToken: 'TUX1uwFRt60Y4CZsWPgVSIOjQCgcOksDDSnh40t81bmVhyzGCbvyo5F2AGa2sz9M',
        } as WebdriverIO.Capabilities,
    ],
};
