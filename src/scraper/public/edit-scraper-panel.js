class EditScraperPanel extends Panel {

    _url;
    _body;
    _doc;
    _scraper;
    _options;

    _form;
    _result;

    constructor(url, body, doc, scraper, options) {
        super();

        this._url = url;
        this._body = body;
        if (doc)
            this._doc = doc;
        else {
            var parser = new DOMParser();
            this._doc = parser.parseFromString(this._body, 'text/html');
        }
        this._scraper = scraper;
        this._options = options;
    }

    async _init() {
        await super._init();
        return Promise.resolve();
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        var $div_left = $('<div/>')
            //.css({ 'display': 'inline-block' });
            .css({ 'float': 'left' });
        var skeleton = [...this._scraper.getSkeleton()];
        var tmp = skeleton.filter(function (x) { return x['name'] == 'domain' });
        if (tmp && tmp.length == 1)
            tmp[0]['size'] = 70;
        var data = { ...this._scraper.getData() };
        this._form = new Form(skeleton, data);
        var $form = await this._form.renderForm();
        $div_left.append($form);
        $div.append($div_left);

        var $div_right = $('<div/>')
            //.css({ 'display': 'inline-block' })
            .css({ 'float': 'right' });
        var skeleton = [
            {
                name: 'body',
                dataType: 'text',
                readonly: true,
                size: '10'
            },
            {
                name: 'result',
                dataType: 'json',
                readonly: true,
                size: '10'
            }
        ];
        var data = { 'body': this._body };
        this._result = new Form(skeleton, data);
        var $form = await this._result.renderForm();
        $div_right.append($form);
        $div.append($div_right);

        $div.append($('<div/>').addClass('clear'));

        var $test = $('<button>')
            .text('Test')
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    var tmpConfig = await this._form.readForm();
                    var result = await Scraper._scrape(this._url, this._doc, tmpConfig, this._options);
                    var data = {
                        'body': this._body,
                        'result': result
                    };
                    this._result.setFormData(data);
                    await this._result.renderForm();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($test);

        var $save = $('<button>')
            .text('Save')
            .css({ 'float': 'right' })
            .click(async function (event) {
                event.stopPropagation();

                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    var data = await this._form.readForm();
                    if (data['domain']) {
                        var oldData = this._scraper.getData();
                        if (oldData['id']) {
                            var changes = await CrudObject.getChanges(this._scraper.getSkeleton(), oldData, data);
                            if (changes && Object.keys(changes).length > 0) {
                                await this._scraper.update(changes);
                                alert('updated');
                            } else
                                alert('nothing changed');
                        } else {
                            await this._scraper.create(data);
                            alert('created');
                        }
                    } else
                        alert('field \'domain\' required');
                    this.dispose();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($save);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}