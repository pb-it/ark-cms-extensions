async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();
    const url = apiController.getApiOrigin() + '/api/ext/process';

    const route = {
        "regex": "^/process$",
        "fn": async function () {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);

                //const response = await controller.getApiController().getApiClient().request("GET", url);

                const panel = new Panel();
                const $iframe = $('<iframe>', {
                    src: url, // 'about:blank'
                    frameborder: 0,
                    scrolling: 'no'
                })
                    .css({
                        'display': 'block',
                        'width': '100%',
                        'height': '100%'
                    });
                /*$iframe.on('load', function () {
                    this.contents().find('body').append(response);
                }.bind($iframe));*/
                panel.setContent($iframe);

                controller.getView().getCanvas().showPanels([panel]);

                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    var application = {
        'name': 'Process',
        'icon': new Icon('bars-progress'),
        'start': async function (event) {
            if (event.ctrlKey) {
                const win = window.open(url, '_blank');
                if (win)
                    win.focus();
            } else
                app.getController().loadState(new State({ customRoute: '/process' }), true);
            return Promise.resolve();
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

export { init };