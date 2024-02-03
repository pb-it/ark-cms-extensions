const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, './src/common/common.js'));

async function setup() {
    await common.exec('cd ' + path.join(appRoot, './extensions/face-recognition') + ' && git clone https://github.com/justadudewhohacks/face-api.js && ln -s ./face-api.js/weights ./public/weights');

    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    /*ws.addExtensionRoute(
        {
            'regex': '^/face-recognition$',
            'fn': async function (req, res) {
                res.sendFile(path.join(__dirname, './public/index.html'));
                return Promise.resolve();
            }.bind(this)
        }
    );*/
    ws.addExtensionRoute(
        {
            'regex': '^/face-recognition/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                var filePath = path.join(__dirname, 'public', file);
                if (fs.existsSync(filePath))
                    res.sendFile(filePath);
                else
                    next();
                return Promise.resolve();
            }.bind(this)
        }
    );

    return Promise.resolve();
}

module.exports = { setup, init };