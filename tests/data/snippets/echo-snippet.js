var result;

try {
    const ws = controller.getWebServer();
    ws.addExtensionRoute({
        'regex': '^/__test/echo$',
        'fn': async function (req, res, next) {
            var msg;
            if (req.method == 'GET') {
                if (req.query)
                    msg = req.query['message'];
            } else if (req.method == 'POST') {
                msg = req.body;
            }
            if (msg)
                res.send(msg);
            else {
                res.status(500);
                res.send('Missing message');
            }
            return Promise.resolve();
        }.bind(this)
    });

    result = 'OK';
} catch (error) {
    result = 'ERROR';
}

return Promise.resolve(result);