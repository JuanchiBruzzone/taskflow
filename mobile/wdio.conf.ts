export const config: WebdriverIO.Config = {
    runner: 'local',

    specs: ['./tests/**/*.test.ts'],

    maxInstances: 1,

    capabilities: [
        {
            platformName: 'Android',
            'appium:automationName': 'UIAutomator2',
            'appium:deviceName': 'emulator-5554',
            'appium:appPackage': 'com.wdiodemoapp',
            'appium:appActivity': '.MainActivity',
            'appium:noReset': false,
            'appium:newCommandTimeout': 240,
        },
    ],

    logLevel: 'info',

    framework: 'mocha',

    reporters: ['spec'],

    mochaOpts: {
        timeout: 60000,
    },

    services: [],

    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
};