async function init() {

    const controller = app.getController();

    if (typeof HttpProxy === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/http-proxy/public/http-proxy.js");
    }

    return Promise.resolve();
}

export { init };