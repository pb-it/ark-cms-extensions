async function configure() {
    const controller = app.getController();
    const ds = controller.getDataService();
    const skeleton = [
        { name: 'origin', dataType: 'string', required: true },
        { name: 'apiKey', label: 'API key', dataType: 'string', required: true }
    ];
    var data;
    var tmp = await ds.fetchData('_registry', null, 'key=chatGptConfig');
    if (tmp && tmp.length == 1)
        data = JSON.parse(tmp[0]['value']);
    else
        data = { 'origin': window.location.origin };
    const panel = new FormPanel(null, skeleton, data);
    panel.setApplyAction(async function () {
        try {
            controller.setLoadingState(true);
            const changed = await panel.getChanges();
            if (changed) {
                const fData = await panel.getForm().readForm();
                const ac = app.getController().getApiController();
                const client = ac.getApiClient();
                const response = await client.request('POST', '/api/ext/chat-gpt/configure', null, fData);
                if (response && response == 'OK') {
                    const msg = 'API server application needs to be restarted for the changes to take effect!'; // 'Reload website for the changes to take effect!'
                    alert('Changes applied successfully.\n' + msg);
                }
            }
            panel.dispose();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    });
    return controller.getModalController().openPanelInModal(panel);
}

async function init() {
    const controller = app.getController();

    const ds = controller.getDataService();
    var tmp = await ds.fetchData('_registry', null, 'key=chatGptConfig');
    if (tmp.length > 0) {
        const resources = [];
        const apiController = controller.getApiController();
        const origin = apiController.getApiOrigin();
        const publicDir = origin + '/api/ext/chat-gpt/public';
        if (typeof ChatGptPanel === 'undefined') {
            resources.push(loadScript(publicDir + '/chat-gpt-panel.js'));
            resources.push(loadStyle(publicDir + '/chat.css'));

            resources.push(loadScript(origin + '/api/ext/chat-gpt/socket.io/socket.io.js'));
        }
        if (resources.length > 0)
            await Promise.all(resources);

        const route = {
            "regex": "^/chat-gpt$",
            "fn": async function () {
                try {
                    const controller = app.getController();
                    const panel = new ChatGptPanel();
                    const modal = await controller.getModalController().openPanelInModal(panel);
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }
        };
        controller.getRouteController().addRoute(route);

        const icon = new Icon('gpt');
        icon.setSvg('<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linejoin="round" d="M18.38 27.94v-14.4l11.19-6.46c6.2-3.58 17.3 5.25 12.64 13.33"/><path fill="none" stroke="currentColor" stroke-linejoin="round" d="m18.38 20.94l12.47-7.2l11.19 6.46c6.2 3.58 4.1 17.61-5.23 17.61"/><path fill="none" stroke="currentColor" stroke-linejoin="round" d="m24.44 17.44l12.47 7.2v12.93c0 7.16-13.2 12.36-17.86 4.28"/><path fill="none" stroke="currentColor" stroke-linejoin="round" d="M30.5 21.2v14.14L19.31 41.8c-6.2 3.58-17.3-5.25-12.64-13.33"/><path fill="none" stroke="currentColor" stroke-linejoin="round" d="m30.5 27.94l-12.47 7.2l-11.19-6.46c-6.21-3.59-4.11-17.61 5.22-17.61"/><path fill="none" stroke="currentColor" stroke-linejoin="round" d="m24.44 31.44l-12.47-7.2V11.31c0-7.16 13.2-12.36 17.86-4.28"/></svg>');
        var application = {
            'name': 'Chat-GPT',
            'icon': icon,
            'start': async function (event) {
                const panel = new ChatGptPanel();
                return app.getController().getModalController().openPanelInModal(panel);
            }
        };
        controller.getAppController().addApp(application);
    } // alert('You must configure this extension before you can use it.');
    return Promise.resolve();
}

export { configure, init };