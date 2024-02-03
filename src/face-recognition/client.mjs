async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof FaceRecognition === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/face-recognition/public/face-recognition.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    await FaceRecognition.init();

    const url = apiController.getApiOrigin() + '/api/ext/face-recognition/public/index.html';
    const route = {
        "regex": "^/face-recognition$",
        "fn": async function () {
            var win = window.open(url, '_blank');
            if (win)
                win.focus();
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    return Promise.resolve();
}

export { init };