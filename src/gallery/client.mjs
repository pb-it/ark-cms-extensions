async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/gallery/public";
    if (typeof Gallery === 'undefined')
        resources.push(loadScript(publicDir + "/gallery.js"));
    await Promise.all(resources);

    await Gallery.init();

    return Promise.resolve();
}

export { init };