const path = require('path');
const fs = require('fs');
//const { opendir } = require('fs').promises;
const https = require('https');

const AxiosWebClient = require('./server/axios-webclient.js');

async function init() {
    const sslRootCAs = require('ssl-root-cas') // 'ssl-root-cas/latest'
        .inject();

    const dir = fs.opendirSync(path.join(__dirname, 'ssl'));
    for await (const file of dir)
        sslRootCAs.addFile(path.join(__dirname, 'ssl/' + file.name));

    https.globalAgent.options.ca = sslRootCAs;

    const axios = new AxiosWebClient();
    controller.getWebClientController().addWebClient('axios', axios);

    return Promise.resolve();
}

async function teardown() {
    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { init, teardown };