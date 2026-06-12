var result;

try {
    const ws = controller.getWebServer();
    ws.addExtensionRoute({
        'regex': '^/__test/redirect.png$', //jpg
        'fn': async function (req, res, next) {
            res.redirect('https://upload.wikimedia.org/wikipedia/commons/1/12/Testbild.png');
            return Promise.resolve();
        }.bind(this)
    });

    result = 'OK';
} catch (error) {
    result = 'ERROR';
}

return Promise.resolve(result);