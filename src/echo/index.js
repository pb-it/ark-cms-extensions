const route = {
    'regex': '^/echo$',
    'fn': function (req, res) {
        var msg;
        if ((req.method == 'POST' || req.method == 'PUT') && req.body)
            msg = req.body;
        else if (req.query)
            msg = req.query['message'];
        res.send(msg);
        return Promise.resolve();
    }
};

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(route);
    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(route);
    //controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { init, teardown };