/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const Service = require('node-windows').Service;

const svc = new Service({
    name: 'AccessibilityBrowserProvider',
    description: 'Provides puppeteer instances on host',
    script: '\\service-wd\\host-browser-service.js',
    env: [
        {
            name: 'APPINSIGHTS_INSTRUMENTATIONKEY',
            value: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
        },
    ],
});

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

svc.on('install', async () => {
    console.log('[windows-service.js]: Windows browser provider service installed, waiting 10 seconds to start');
    await wait(10000);
    console.log('[windows-service.js]: Starting Windows browser provider service');
    svc.start();
});

console.log('[windows-service.js]: Created browser provider node-windows object.');
if (svc.exists) {
    svc.once('uninstall', async () => {
        console.log('[windows-service.js]: Service has been uninstalled. Reinstalling in 10 seconds.');
        await wait(10000);
        console.log('[windows-service.js]: Installing windows browser provider service');
        svc.install();
    });

    console.log('[windows-service.js]: Service already exists. Stopping, then uninstalling.');
    svc.once('stop', svc.uninstall);
    svc.once('alreadystopped', svc.uninstall);
    svc.stop();
} else {
    console.log('[windows-service.js]: Service does not exist. Installing.');
    svc.install();
}

svc.on('start', () => {
    console.log('[windows-service.js]: Windows browser provider service started');
});
