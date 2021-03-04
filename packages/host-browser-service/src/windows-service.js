/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const Service = require('node-windows').Service;

const svc = new Service({
    name:'AccessibilityBrowserProvider',
    description: 'Provides puppeteer instances on host',
    script: '\\service-wd\\host-browser-service.js',
    env: [{
        name: 'APPINSIGHTS_INSTRUMENTATIONKEY',
        value: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    }],
});

console.log('Created service object');

svc.on('install', function() {
    console.log('Windows browser provider service installed, waiting 10 seconds to start');
    setTimeout(() => {
        console.log('starting Windows browser provider service');
        svc.start();
    }, 10000);
});

svc.install();

svc.on('start', () => {
    console.log('Windows browser provider service started');
});
