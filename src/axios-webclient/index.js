const path = require('path');
const fs = require('fs');
//const { opendir } = require('fs').promises;
//const https = require('https');

var AxiosWebClient;

async function init() {
    var resolved;
    var p = './server/axios-webclient.js';
    resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];
    AxiosWebClient = require('./server/axios-webclient.js');

    const sslRootCAs = require('ssl-root-cas') // 'ssl-root-cas/latest'
        .inject(); // same as .create()?

    const dir = fs.opendirSync(path.join(__dirname, 'ssl'));
    for await (const file of dir)
        sslRootCAs.addFile(path.join(__dirname, 'ssl/' + file.name));

    var httpsAgent;
    /*httpsAgent = new https.Agent({
        ca: sslRootCAs
    });*/
    //https.globalAgent.options.ca = sslRootCAs; // injection seems to work globally by default
    //https.globalAgent.options.rejectUnauthorized = false;

    const registry = controller.getRegistry();
    const userAgent = await registry.get('defaultUserAgent');
    const bDefault = await registry.get('defaultWebClient') === 'axios';
    var config;
    if (httpsAgent || userAgent) {
        config = {
            withCredentials: true
        };
        if (httpsAgent)
            config['httpsAgent'] = httpsAgent;
        if (userAgent) {
            config['headers'] = {
                common: {
                    'User-Agent': userAgent
                }
            }
        }
    }
    const axios = new AxiosWebClient(config);
    controller.getWebClientController().addWebClient(axios, bDefault);

    return Promise.resolve();
}

async function teardown() {
    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { init, teardown };