import { config as baseConfig } from "./wdio.shared.local.appium.conf.js";

export const config: WebdriverIO.Config = {
    ...baseConfig,

    baseUrl: 'https://hotel-example-site.takeyaqa.dev/ja/',

    // ============
    // Specs
    // ============
    specs: ["../tests/specs/**/hotel.*.spec.ts"],

    // ============
    // Capabilities
    // ============
    capabilities: [
        {
            platformName: "Android",
            browserName: "chrome",
            "wdio:maxInstances": 1,
            //
            // NOTE: Change this name according to the Emulator you have created on your local machine
            "appium:deviceName": "emulator-5554",
            //
            // NOTE: Change this version according to the Emulator you have created on your local machine
            "appium:platformVersion": "17",
            "appium:automationName": "UiAutomator2",
            "appium:orientation": "PORTRAIT",
            "appium:newCommandTimeout": 240,
            "wdio:enforceWebDriverClassic": true,
        },
    ],
};
