class Clipboard2 {

    static KEY = '_sys.ext.clipboard2'

    static init() {
        app.getController().getView().getTopNavigationBar().addIconBarItem({
            name: 'clipboard2',
            func: () => {
                var menuItem;
                const controller = app.getController();
                if (controller.hasConnection()) {
                    var conf = {
                        //'style': 'iconbar',
                        'icon': new Icon('paperclip'),
                        //'tooltip': 'Clipboard2',
                        'click': async function (event, icon) {
                            event.preventDefault();
                            event.stopPropagation();

                            const controller = app.getController();
                            controller.setLoadingState(true);
                            try {
                                if (typeof Clipboard2Panel === 'undefined') {
                                    const apiController = controller.getApiController();
                                    const origin = apiController.getApiOrigin();
                                    await loadScript(origin + '/api/ext/clipboard2/public/js/view/panels/clipboard2-panel.js');
                                }
                                await controller.getModalController().openPanelInModal(new Clipboard2Panel());
                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }
                            return Promise.resolve();
                        }
                    };
                    menuItem = new MenuItem(conf);
                    var count;
                    var data = Clipboard2.get();
                    if (data) {
                        count = Object.keys(data).length;
                        if (count > 0)
                            menuItem.setNotification(count);
                    }
                }
                return menuItem;
            }
        });
    }

    static get(key) {
        var res;
        var tmp = window.localStorage.getItem(Clipboard2.KEY);
        if (tmp) {
            tmp = JSON.parse(tmp);
            if (key)
                res = tmp[key];
            else
                res = tmp;
        }
        return res;
    }

    static set(key, value) {
        var data;
        var tmp = window.localStorage.getItem(Clipboard2.KEY);
        if (tmp)
            data = JSON.parse(tmp);
        else
            data = {};
        data[key] = value;
        window.localStorage.setItem(Clipboard2.KEY, JSON.stringify(data));
        Clipboard2._updateMenuItem(Object.keys(data).length);
    }

    static delete(key) {
        var tmp = window.localStorage.getItem(Clipboard2.KEY);
        if (tmp) {
            var data = JSON.parse(tmp);
            if (data.hasOwnProperty(key)) {
                delete data[key];
                var count = Object.keys(data).length;
                if (count > 0)
                    window.localStorage.setItem(Clipboard2.KEY, JSON.stringify(data));
                else
                    window.localStorage.removeItem(Clipboard2.KEY);
                Clipboard2._updateMenuItem(count > 0 ? count : '');
            }
        }
    }

    static _updateMenuItem(notification) {
        const tnb = app.getController().getView().getTopNavigationBar();
        var tmp = tnb.getIconBarItem('clipboard2');
        if (tmp) {
            const menu = tmp['menu'];
            menu.getMenuItem().setNotification(notification);
            menu.renderMenuItem();
        }
    }
}