class DlhOverview extends Panel {

    _downloads;

    constructor() {
        super();
    }

    async _init() {
        await super._init();

        const ac = app.getController().getApiController();
        const client = ac.getApiClient();
        var tmp = await client.request('GET', '/api/ext/dlh/download');
        if (tmp)
            this._downloads = JSON.parse(tmp);

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const $ul = $('<ul/>');
        var $li;
        if (this._downloads && this._downloads.length > 0) {
            const ac = app.getController().getApiController();
            const origin = ac.getApiOrigin();
            for (var x of this._downloads) {
                $li = $('<li/>');
                $li.append(x['id']);
                $li.append('<br><b>' + x['state'] + '</b>');
                $li.append('<br>' + x['url']);
                if (x['file']) {
                    $li.append('<br>' + x['file']);
                }
                if (x['logfile']) {
                    $li.append('<br><a href="' + origin + '/api/ext/dlh' + x['logfile'] + '">' + x['logfile'] + '</a>');
                }
                $ul.append($li);
            }
        }
        $div.append($ul);

        const $add = $('<button>')
            .text('Add')
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                try {
                    const skeleton = [
                        {
                            'name': 'url',
                            'dataType': 'string'
                        },
                        {
                            'name': 'options',
                            'dataType': 'string'
                        }
                    ];
                    const panel = new FormPanel(null, skeleton);
                    panel.setApplyAction(async function (p) {
                        controller.setLoadingState(true);
                        try {
                            const data = await p.getForm().readForm({ bSkipNullValues: false });

                            const ac = app.getController().getApiController();
                            const client = ac.getApiClient();
                            var tmp = await client.request('POST', '/api/ext/dlh/download', null, data);

                            return controller.loadState(new State({ customRoute: '/dlh' }), true);
                        } catch (error) {
                            controller.setLoadingState(false);
                            controller.showError(error);
                        }
                        return Promise.resolve(true);
                    });
                    await controller.getModalController().openPanelInModal(panel);
                } catch (error) {
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        $div.append($add);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}