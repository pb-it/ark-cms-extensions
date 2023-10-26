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

    controller.getView().getSideNavigationBar().addIconBarItem(() => {
        var conf;
        if (controller.hasConnection()) {
            conf = {
                'style': 'iconbar',
                'icon': 'comments',
                'tooltip': 'Chat',
                'click': function (event, icon) {
                    const controller = app.getController();
                    controller.getView().getSideNavigationBar().close();

                    var win = window.open(url, '_blank');
                    win.focus();
                }
            };
        }
        return conf;
    }, false);

    return Promise.resolve();
}

export { init };