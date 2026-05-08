import { config as baseConfig } from './wdio.shared.local.appium.conf.js';

export const config: WebdriverIO.Config = {
    ...baseConfig,

    // ============
    // Specs
    // ============
    specs: ['../tests/specs/**/browser*.spec.ts'],

    // ============
    // Capabilities
    // ============
    // For all capabilities please check
    // http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
    capabilities: [
        {
            // The defaults you need to have in your config
            platformName: 'Android',
            browserName: 'chrome',
            'wdio:maxInstances': 1,
            // For W3C the appium capabilities need to have an extension prefix
            // http://appium.io/docs/en/writing-running-appium/caps/
            // This is `appium:` for all Appium Capabilities which can be found here

            //
            // NOTE: Change this name according to the Emulator you have created on your local machine
            'appium:deviceName': 'emulator-5554',
            //
            // NOTE: Change this version according to the Emulator you have created on your local machine
            'appium:platformVersion': '17',
            'appium:automationName': 'UiAutomator2',
            'appium:orientation': 'PORTRAIT',
            'appium:newCommandTimeout': 240,
            'wdio:enforceWebDriverClassic': true,
        },
    ],
};
