async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/clipboard2/public';
    if (typeof Clipboard2 === 'undefined')
        resources.push(loadScript(publicDir + '/js/clipboard2.js'));
    if (resources.length > 0)
        await Promise.all(resources);

    if (window.localStorage)
        Clipboard2.init();

    return Promise.resolve();
}

export { init };