class TestHttpProxyPanel extends Panel {

    _url;
    _clients;
    _data;
    _form;

    _$result;

    constructor(url) {
        super();

        if (url)
            this._url = url;
        else
            this._url = 'https://www.google.com';
        this._data = {
            'url': this._url
        };
    }

    async _init() {
        await super._init();

        this._clients = [];

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const skeleton = [
            {
                'name': 'url',
                'dataType': 'string'
            },
            /*{
                name: 'client',
                dataType: 'enumeration',
                view: 'select',
                options: this._clients,
                //required: true
            },*/
            {
                'name': 'options',
                'dataType': 'json'
            },
        ];
        this._form = new Form(skeleton, this._data);
        const $form = await this._form.renderForm();
        $div.append($form);

        const $request = $('<button>')
            .text('Request')
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    this._data = await this._form.readForm();
                    const res = await HttpProxy.request(this._data['url'], this._data['options']);
                    await this._renderResult(res);

                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($request);

        this._$result = $('<div/>');
        $div.append(this._$result);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _renderResult(res) {
        this._$result.empty();

        var text;
        if (typeof (res) === 'string' || (res) instanceof String)
            text = res;
        else if (typeof (res) === 'object')
            text = JSON.stringify(res, null, '\t');

        const ta = $('<textarea/>')
            .attr('id', 'response')
            .attr('rows', 30)
            .attr('cols', 100)
            .prop('disabled', true)
            .val(text);
        this._$result.append(ta);

        const $save = $('<button>')
            .text('Save to File')
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    FileCreator.createFileFromText('response.html', text);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        this._$result.append($save);

        return Promise.resolve();
    }
}