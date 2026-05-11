import { config as baseConfig } from './wdio.shared.local.appium.conf.js';

export const config: WebdriverIO.Config = {
    ...baseConfig,

    baseUrl: 'https://hotel-example-site.takeyaqa.dev/ja/',

    specs: ['../tests/specs/**/hotel.*.spec.ts'],

    capabilities: [
        {
            platformName: 'Android',
            browserName: 'chrome',
            'wdio:maxInstances': 1,
            'appium:deviceName': 'Pixel 5',
            'appium:udid': 'pixel_5.adb.appkitbox.com:47002',
            'appium:automationName': 'UiAutomator2',
            'appium:orientation': 'PORTRAIT',
            'appium:newCommandTimeout': 240,
            'wdio:enforceWebDriverClassic': true,
        },
    ],
};
