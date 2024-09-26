async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/state-bm/public';
    if (typeof BookmarkController === 'undefined')
        resources.push(loadScript(publicDir + '/js/bookmark-controller.js'));
    if (typeof ManageBookmarkPanel === 'undefined')
        resources.push(loadScript(publicDir + '/js/manage-bookmark-panel.js'));
    if (resources.length > 0)
        await Promise.all(resources);

    const bc = new BookmarkController();
    await bc.init();

    controller.getView().getSideNavigationBar().addIconBarItem({
        name: 'bookmarks',
        func: () => {
            var conf;
            const controller = app.getController();
            if (controller.hasConnection() && controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('bookmark'),
                    'tooltip': 'Bookmarks',
                    'click': async function (event, icon) {
                        event.preventDefault();
                        event.stopPropagation();

                        const controller = app.getController();
                        controller.getView().getSideNavigationBar().close();

                        const config = { 'minWidth': '1000px' };
                        return controller.getModalController().openPanelInModal(new ManageBookmarkPanel(config, bc));
                    }.bind(this)
                };
            }
            return conf;
        }
    }, false);

    return Promise.resolve();
}

export { init };