class BulletinBoard extends Panel {

    _items;

    _$div;

    constructor() {
        super();

        this._items = [];
    }

    async _init() {
        await super._init();

        if (!this._$div) { // !this._bRendered
            this._$panel.on("dragover.panel", function (event) {
                event.preventDefault();
            });
            this._$panel.on("dragleave.panel", function () {
            });
            this._$panel.on("drop.panel", this._drop.bind(this));
        }

        return Promise.resolve();
    }

    async _renderContent() {
        if (this._$div)
            this._$div.empty();
        else {
            this._$div = $('<div/>')
                .css({ 'padding': '10', 'min-height': '80vh' });

            await this._load();
        }

        /*const controller = app.getController();
        //const obj = new CrudObject('note', { 'id': 2 });
        const obj = await controller.getDataService().fetchObjectById('note', 2);
        const model = controller.getModelController().getModel('note');
        //const model = obj.getModel();
        const mpcc = model.getModelPanelConfigController();
        const panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
        //const panel = PanelController.createPanelForObject(obj, panelConfig);
        const panel = new NotePanel(panelConfig, obj, 'note');
        panels.push(panel);*/

        if (this._items.length > 0) {
            for (var item of this._items) {
                this._$div.append(await item.render());
            }

            const $divMenu = $('<div/>')
                .css({
                    'position': 'absolute',
                    'bottom': '0'
                });
            const $clearButton = $('<button/>')
                .text('Clear')
                .click(async function (event) {
                    event.stopPropagation();
                    this._items = [];
                    await this.render();
                    return Promise.resolve();
                }.bind(this));
            $divMenu.append($clearButton);
            const $button = $('<button/>')
                .text('Save')
                .click(async function (event) {
                    event.stopPropagation();
                    await this._store();
                    return Promise.resolve();
                }.bind(this));
            $divMenu.append($button);
            this._$div.append($divMenu);
        } else
            this._$div.append('Drop or paste note here ...');

        const $footer = $('<div/>')
            .addClass('clear');
        this._$div.append($footer);

        return Promise.resolve(this._$div);
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();

        const controller = app.getController();
        try {
            controller.setLoadingState(true, false);

            const dT = event.originalEvent.dataTransfer;
            if (dT) {
                const str = dT.getData("text/plain");
                const url = new URL(str);
                const state = State.getStateFromUrl(url);
                if (state) {
                    const droptype = state['typeString'];
                    const model = controller.getModelController().getModel(droptype);
                    if (model) {
                        var bNote = droptype === 'note'; // model.getName() === 'note'
                        if (!bNote) {
                            /*const mpcc = model.getModelPanelConfigController();
                            const panelConfig = mpcc.getPanelConfig();
                            bNote = panelConfig.getPanelClass() === NotePanel;*/

                            const config = model.getModelDefaultsController().getDefaultPanelConfig();
                            bNote = config[ModelDefaultsController.PANEL_TYPE_IDENT] === 'NotePanel';
                        }

                        if (bNote) {
                            /*const objs = [];
                            const data = await controller.getDataService().fetchDataByState(state);
                            if (data) {
                                if (Array.isArray(data)) {
                                    for (var x of data) {
                                        objs.push(new CrudObject(droptype, x));
                                    }
                                } else
                                    objs.push(new CrudObject(droptype, data));
                            }*/

                            const id = state['id'];
                            if (isNaN(id))
                                throw new Error('Invalid data');
                            const obj = await controller.getDataService().fetchObjectById(droptype, id);

                            const mpcc = model.getModelPanelConfigController();
                            const panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
                            const panel = new NotePanel(panelConfig, obj, 'note');
                            const rect = this._$div[0].getBoundingClientRect();
                            const item = new BulletinBoardWrapper(this._$div, panel, event.pageX - rect.left, event.pageY - rect.top);
                            this._items.push(item);

                            await this.render();
                        }
                    }
                }
            }
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _load() {
        const controller = app.getController();
        const ds = controller.getDataService();
        var data;
        var tmp = await ds.fetchData('_registry', null, 'key=bulletin-board');
        console.log(tmp);
        if (tmp && tmp.length == 1)
            data = JSON.parse(tmp[0]['value']);
        if (data && data.length > 0) {
            var panel;
            var item;
            const model = controller.getModelController().getModel('note');
            const mpcc = model.getModelPanelConfigController();
            const panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
            for (var i of data) {
                const obj = await ds.fetchObjectById('note', i['id']);
                panel = new NotePanel(panelConfig, obj, 'note');
                item = new BulletinBoardWrapper(this._$div, panel, i['x'], i['y']);
                this._items.push(item);
            }
        }
        return Promise.resolve();
    }

    async _store() {
        const data = [];
        if (this._items.length > 0) {
            var tmp;
            var panel;
            for (var item of this._items) {
                panel = item.getPanel();
                tmp = { 'id': panel.getObject().getData()['id'] };
                tmp['x'] = item.getPosX();
                tmp['y'] = item.getPosY();
                data.push(tmp);
            }
        }
        if (data.length > 0) {
            const value = JSON.stringify(data);
            console.log(value);
            const res = await app.getController().getDataService().request('_registry', ActionEnum.update, null, { 'key': 'bulletin-board', 'value': value });
        }
        return Promise.resolve();
    }
}