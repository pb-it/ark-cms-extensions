const path = require('path');
const fs = require('fs');

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {
    var ws = controller.getWebServer();
    //ws.getApp().use('/api/console/public', express.static(path.join(__dirname, 'public'), { fallthrough: false }));
    ws.addExtensionRoute(
        {
            'regex': '^/console/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                console.log(file);
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