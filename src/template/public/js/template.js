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

        controller.getView().getSideNavigationBar().addIconBarItem({
            name: 'template',
            func: () => {
                var conf;
                if (controller.hasConnection()) {
                    conf = {
                        'style': 'iconbar',
                        'icon': new Icon('icons'),
                        'tooltip': 'Template',
                        'click': function (event, icon) {
                            app.getController().loadState(new State({ customRoute: '/template' }), true);
                        }
                    };
                }
                return conf;
            }
        }, false);

        return Promise.resolve();
    }
}