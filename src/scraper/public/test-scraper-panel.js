class TestScraperPanel extends Panel {

    static URL_SKELETON = [
        {
            name: 'url',
            dataType: 'string',
            size: '70'
        },
        {
            name: 'bCache',
            dataType: 'boolean',
            required: true,
            defaultValue: true
        }
    ];

    _console;
    _log;

    _url;
    _body;
    _doc;
    _options;
    _scraper;
    _result;

    _urlForm;
    _bodyForm;
    _scraperForm;
    _resultForm;

    constructor() {
        super();

        this._log = '';
        const xconsole = {};
        xconsole.log = this.log.bind(this);
        xconsole.info = console.info;
        xconsole.warn = console.warn;
        xconsole.error = console.error;
        this._console = xconsole;
        this._options = {
            'console': this._console
        };
    }

    log(x) {
        this._log += x + '\n';
    }

    init(url, body, doc, scraper, options) {
        this._url = url;
        this._body = body;
        this._doc = doc;
        this._scraper = scraper;
        this._options = options;
    }

    /*dispose() {
        const tmpConfig = await this._scraperForm.readForm();
        this._scraper.setData(tmpConfig);
        return super.dispose();
    }*/

    getScraper() {
        return this._scraper;
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        this._urlForm = new Form(TestScraperPanel.URL_SKELETON, { 'url': this._url });
        var $form = await this._urlForm.renderForm();
        $div.append($form);

        const $load = $('<button>')
            .text('Load Scraper')
            .click(async function (event) {
                event.stopPropagation();

                return this._loadScraper();
            }.bind(this));
        $div.append($load);

        const $curl = $('<button>')
            .text('Curl')
            .click(async function (event) {
                event.stopPropagation();

                return this._curl();
            }.bind(this));
        $div.append($curl);

        var skeleton = [
            {
                name: 'body',
                dataType: 'text',
                readonly: true,
                size: '10'
            }
        ];
        var data = { 'body': this._body };
        this._bodyForm = new Form(skeleton, data);
        $form = await this._bodyForm.renderForm();
        $div.append($form);


        var $form = await this._renderScraper();
        $div.append($form);

        var $test = $('<button>')
            .text('Test')
            .click(async function (event) {
                event.stopPropagation();

                if (this._url && this._doc) {
                    const controller = app.getController();
                    try {
                        controller.setLoadingState(true);
                        const tmpConfig = await this._scraperForm.readForm();
                        this._scraper.setData(tmpConfig);
                        this._log = '';
                        const result = await Scraper._scrape(this._url, this._doc, tmpConfig, this._options);
                        const data = {
                            'console': this._log,
                            'result': result
                        };
                        this._resultForm.setFormData(data);
                        await this._resultForm.renderForm();
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                } else
                    alert('Missing Body - Curl first!');

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
                    const data = await this._scraperForm.readForm();
                    if (data['domain']) {
                        const oldData = this._scraper.getData();
                        if (oldData['id']) {
                            const changes = await CrudObject.getChanges(this._scraper.getSkeleton(), oldData, data);
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
                    //this.dispose();
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    controller.showError(error);
                }

                return Promise.resolve();
            }.bind(this));
        $div.append($save);

        skeleton = [
            {
                name: 'console',
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
        data = { 'result': this._result };
        this._resultForm = new Form(skeleton, data);
        $form = await this._resultForm.renderForm();
        $div.append($form);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async _loadScraper() {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);
            const fData = await this._urlForm.readForm();
            const url = fData['url'];

            const rule = await Scraper.getRule(url);
            this._scraper = new CrudObject('scraper', rule);

            await this._renderScraper();

            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }

        return Promise.resolve();
    }

    async _renderScraper() {
        if (!this._scraperForm) {
            if (!this._scraper)
                this._scraper = new CrudObject('scraper');
            var skeleton = [...this._scraper.getSkeleton()];
            var tmp = skeleton.filter(function (x) { return x['name'] == 'domain' });
            if (tmp && tmp.length == 1)
                tmp[0]['size'] = 70;
            var data = { ...this._scraper.getData() };

            this._scraperForm = new Form(skeleton, data);
        } else {
            if (this._scraper)
                this._scraperForm.setFormData({ ...this._scraper.getData() });
        }
        const $form = await this._scraperForm.renderForm();
        return Promise.resolve($form);
    }

    async _curl() {
        const controller = app.getController();
        try {
            controller.setLoadingState(true);

            const fData = await this._urlForm.readForm();
            const url = fData['url'];

            var body;
            if (fData['bCache']) {
                var cache = await HttpProxy.lookup(url);
                if (cache)
                    body = cache['body'];
            }
            if (!body) {
                var options;
                if (this._scraper) {
                    const data = this._scraper.getData();
                    options = data['options'];
                }
                if (fData['bCache']) {
                    if (options)
                        options['bCache'] = true;
                    else
                        options = {
                            'bCache': true
                        };
                }
                body = await HttpProxy.request(url, options);
            }

            this._url = url;
            this._body = body;
            var data = {
                'body': this._body
            };
            this._bodyForm.setFormData(data);
            await this._bodyForm.renderForm();

            const parser = new DOMParser();
            this._doc = parser.parseFromString(this._body, 'text/html');

            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }

        return Promise.resolve();
    }
}