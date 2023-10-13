async function init() {
    const controller = app.getController();

    var formatter = controller.getFormatter();
    formatter.setStyle('javascript', async function (code) {
        if (typeof js_beautify === 'undefined')
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.9/beautify.min.js");
        code = js_beautify(code, options);
        return Promise.resolve(code);
    });

    return Promise.resolve();
}

export { init };