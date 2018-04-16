const http = require('http');
const Koa = require('koa');
const { Eureka } = require('eureka-js-client');
const VERSION = require('../package.json').version;

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const app = new Koa();

// This is all of the required values in the configuration to register to Spring Cloud Eureka
// If you are missing anything you will get a 500 error for a NPE
// If you have incorrect format for port (not an object) or dataCenterInfo (missing @class) it will 404
const eureka = new Eureka({
    // Dislike this format, prefer a single string Uri for config
    eureka: {
        host: '192.168.0.9',
        port: 8761,
        servicePath: '/eureka/apps'
    },
    instance: {
        app: 'nodejs-demo',
        hostName: HOST,
        ipAddr: HOST,
        statusPageUrl: `http://${HOST}:${PORT}/info`,
        port: {
            '$': PORT,
            '@enabled': 'true',
        },
        vipAddress: HOST,
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn'        
        }
    }
});

// Default server error handler
app.on('error', err => {
    // connection aborted
    if (err.code === 'ECONNRESET') return;
    console.error('Error (%s): %s', err.code || err.errno || '', err.stack || err.message || err);
});

// This is just because using routes for this test case is excessive
app.use(ctx => {
    switch (ctx.request.path) {
    case '/info':
        const info = {
            name: 'nodejs-demo',
            version: VERSION,
            uptime: process.uptime()
        };
        ctx.type = 'json';
        ctx.body = info;
        break;

    case '/':
        ctx.body = `
            <!doctype html>
            <html>
                <head>
                    <title>Demo</title>
                </head>
                <body>
                    <h1>Demo</h1>
                </body>
            </html>
            `;
        break;

    default:
        ctx.status = 404;
    }
});

const server = http.createServer(app.callback());

server.listen(PORT, HOST, () => {
    const { address, port } = server.address();
    console.log(`Server listening on ${address}:${port}`);
    eureka.start();
});
