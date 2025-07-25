async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();
    const url = apiController.getApiOrigin() + '/api/ext/chat';

    const route = {
        "regex": "^/chat$",
        "fn": async function () {
            var win = window.open(url, '_blank');
            if (win)
                win.focus();
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    var application = {
        'name': 'Chat',
        'icon': new Icon('comments'),
        'start': async function (event) {
            var win = window.open(url, '_blank');
            win.focus();
            return Promise.resolve();
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

export { init };