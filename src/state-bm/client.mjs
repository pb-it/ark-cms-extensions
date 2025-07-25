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

    var application = {
        'name': 'Bookmarks',
        'icon': new Icon('bookmark'),
        'start': async function (event) {
            const config = { 'minWidth': '1000px' };
            return app.getController().getModalController().openPanelInModal(new ManageBookmarkPanel(config, bc));
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

export { init };