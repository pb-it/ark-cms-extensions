class DlhConfigPanel extends Panel {

    _version;
    _data;
    _form;

    constructor() {
        super();
    }

    async _init() {
        await super._init();

        const controller = app.getController();
        const ds = controller.getDataService();

        var tmp;
        const ac = controller.getApiController();
        const client = ac.getApiClient();
        var response = await client.request('GET', '/api/ext/dlh/info');
        if (response) {
            tmp = JSON.parse(response);
            this._version = tmp['version'];
        }

        const skeleton = [
            { name: 'bNative', label: 'Use Native Client', dataType: 'boolean', required: true, readonly: (this._version == null) },
            { name: 'funcRuleset', label: 'Ruleset', dataType: 'text' }
        ];

        tmp = await ds.fetchData('_registry', null, 'key=dlhConfig');
        if (tmp && tmp.length == 1)
            this._data = JSON.parse(tmp[0]['value']);
        else
            this._data = { 'bNative': false };
        if (!this._version)
            this._data['bNative'] = false;

        this._form = new Form(skeleton, this._data);

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append(`Native Client Version: ${this._version ? this._version : 'unknown'}<br>`);

        const $form = await this._form.renderForm();
        $div.append($form);

        const $apply = $('<button>')
            .text('Apply')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                const controller = app.getController();
                try {
                    controller.setLoadingState(true);

                    const fData = await this._form.readForm();
                    if (fData['bNative'] != this._data['bNative'] || fData['funcRuleset'] != this._data['funcRuleset']) {
                        const ac = app.getController().getApiController();
                        const client = ac.getApiClient();
                        const response = await client.request('POST', '/api/ext/dlh/configure', null, fData);
                        if (response && response == 'OK') {
                            alert('Changes applied successfully.');
                            this._data = fData;
                        }
                    }
                    this.dispose();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }
                return Promise.resolve();
            }.bind(this));
        $div.append($apply);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}