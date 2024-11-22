class TestHttpProxyPanel extends Panel {

    _data;
    _form;

    _$result;

    constructor() {
        super();
        this._data = {
            'url': 'https://www.google.com'
        };
    }

    async _init() {
        await super._init();
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const skeleton = [
            {
                'name': 'url',
                'dataType': 'string'
            }
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

                    const res = await HttpProxy.request(this._data['url']);
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

        const ta = $('<textarea/>')
            .attr('rows', 30)
            .attr('cols', 100)
            .prop('disabled', true)
            .val(res);
        this._$result.append(ta);

        const $save = $('<button>')
            .text('Save to File')
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    FileCreator.createFileFromText('response.html', res);
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