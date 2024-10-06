class SnippetController {

    static initSideMenu(model) {
        const stateSelect = app.getController().getView().getSideNavigationBar().getStateSelect();
        const conf = {
            'name': 'Snippets',
            'click': async function (event, item) {
                event.preventDefault();
                event.stopPropagation();
                const menuItem = item.getMenuItem();
                const menu = menuItem.getMenu();
                if (item.isActive()) {
                    menu.setActiveItem();
                    await this.updateStateSelect(this._profile, this._model, this._action);
                } else {
                    menu.setActiveItem(menuItem);
                    await this.updateStateSelect(this._profile, this._model, this._action, 'snippets', new SelectSnippetPanel(this._model));
                }
                return Promise.resolve();
            }.bind(stateSelect)
        };
        const menuItem = new MenuItem(conf);
        menuItem.setSubMenu(new Menu());
        const entries = model.getSideMenuEntries();
        entries.push(menuItem);
    }

    _model;
    _treeConfig;
    _tree;

    constructor(model) {
        this._model = model;
        const definition = this._model.getDefinition();
        if (definition.hasOwnProperty('_ext') && definition['_ext'].hasOwnProperty('snippets'))
            this._treeConfig = JSON.parse(definition['_ext']['snippets']);
        else
            this._treeConfig = [];
        this._tree = new Tree(JSON.parse(JSON.stringify(this._treeConfig)));
    }

    getModel() {
        return this._model;
    }

    getTreeConfig() {
        return this._treeConfig;
    }

    getTree() {
        return this._tree;
    }

    async updateSnippets(snippets) {
        const str = JSON.stringify(snippets);
        const definition = this._model.getDefinition();
        if (snippets) {
            if (definition.hasOwnProperty('_ext'))
                definition['_ext']['snippets'] = str;
            else
                definition['_ext'] = { 'snippets': str };
        } else if (definition.hasOwnProperty('_ext')) {
            if (definition['_ext'].hasOwnProperty('snippets')) {
                delete definition['_ext']['snippets'];
                if (Object.keys(definition['_ext']).length == 0)
                    delete definition['_ext'];
            }
        }
        await this._model.setDefinition(definition);
        this._treeConfig = snippets;
        this._tree.setTreeConf(JSON.parse(JSON.stringify(this._treeConfig)));
        return Promise.resolve();
    }
}