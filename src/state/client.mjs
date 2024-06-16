async function init() {
    const controller = app.getController();

    const scripts = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/state/public";
    if (typeof StatePanel === 'undefined')
        scripts.push(loadScript(publicDir + "/state-panel.js"));
    await Promise.all(scripts);

    const models = controller.getModelController().getModels();
    for (var model of models) {
        await initModel(model);
    }

    /*controller.getView().getSideNavigationBar().addIconBarItem({
        name: 'state',
        func: () => {
            var conf;
            if (controller.hasConnection() && controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('paperclip'),
                    'tooltip': 'State',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        const controller = app.getController();
                        try {
                            const snb = controller.getView().getSideNavigationBar();
                            const bib = snb.getBottomIconBar();
                            const activeIcon = bib.getActiveItem();
                            snb.close();

                            const item = icon.getMenuItem();
                            if (activeIcon != item) {
                                bib.setActiveItem(item);
                                snb.updateSideNavigationBar();
                                const $div = $('<div/>');
                                $div.append('Under Construction');
                                snb.getSidePanel().show($div);
                            }
                        } catch (error) {
                            controller.showError(error);
                        }
                        return Promise.resolve();
                    }
                };
            }
            return conf;
        }
    }, false);*/

    return Promise.resolve();
}

async function initModel(model) {
    const entries = model.getSideMenuEntries();
    if (entries.length == 0) {
        entries.push({
            'name': 'State2',
            'click': async function (event, item) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                try {
                    const snb = controller.getView().getSideNavigationBar();
                    const stateSelect = snb.getStateSelect();

                    const menuItem = item.getMenuItem();
                    const menu = menuItem.getMenu();
                    if (menuItem.isActive()) {
                        menu.setActiveItem();
                        await stateSelect.updateStateSelect(stateSelect.getProfile(), model.getName(), 'show');
                    } else {
                        menu.setActiveItem(menuItem);
                        const panel = new StatePanel();
                        await stateSelect.updateStateSelect(stateSelect.getProfile(), model.getName(), 'show', 'State2', panel);
                    }
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(model),
            'panel': true
        });
    }
    return Promise.resolve();
}

export { init, initModel };