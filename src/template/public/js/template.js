class Template {

    static async init() {
        const controller = app.getController();

        const route = {
            'regex': '^/template$',
            'fn': async function (path) {
                alert('hello');
                /*const controller = app.getController();
                try {
                    controller.setLoadingState(true);
                    const panel = new Panel();
                    // ...
                    controller.getView().getCanvas().showPanels([panel]);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }*/
                return Promise.resolve();
            }
        };
        controller.getRouteController().addRoute(route);

        var application = {
            'name': 'Template',
            'icon': new Icon('icons'),
            'start': async function (event) {
                return app.getController().loadState(new State({ customRoute: '/template' }), true);
            }
        };
        controller.getAppController().addApp(application);

        return Promise.resolve();
    }
}