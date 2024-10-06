class DashboardController {

    static initDashboard(model) {
        const code = DashboardController.getCode(model.getDefinition());
        if (code) {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            model['createDashboard'] = new AsyncFunction(code);
        } else
            delete model['createDashboard'];
        if (typeof model['createDashboard'] === 'function')
            DashboardController._addSideMenuEntry(model);

        const tabs = model.getConfigTabs();
        tabs.push(new DashboardConfigTab(model));
    }

    static _addSideMenuEntry(model) {
        const conf = {
            'name': 'Dashboard',
            'click': function (event, item) {
                const state = new State();
                state['customRoute'] = '/dashboard/' + this.getName();
                app.getController().loadState(state, true);
            }.bind(model)
        };
        const menuItem = new MenuItem(conf);
        const entries = model.getSideMenuEntries();
        entries.push(menuItem);
    }

    static getCode(definition) {
        var code;
        if (definition.hasOwnProperty('_ext') && definition['_ext'].hasOwnProperty('dashboard') &&
            definition['_ext']['dashboard'].hasOwnProperty('strDashboard'))
            code = definition['_ext']['dashboard']['strDashboard'];
        return code;
    }

    static async updateDashboard(model, code) {
        const def = model.getDefinition();
        DashboardController.updateDefinition(def, code);
        await model.setDefinition(def);

        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        model['createDashboard'] = new AsyncFunction(code);

        DashboardController._addSideMenuEntry(model);
        return Promise.resolve();
    }

    static updateDefinition(definition, code) {
        if (code) {
            const config = { 'strDashboard': code };
            if (definition.hasOwnProperty('_ext'))
                definition['_ext']['dashboard'] = config;
            else
                definition['_ext'] = { 'dashboard': config };
        } else if (definition.hasOwnProperty('_ext')) {
            if (definition['_ext'].hasOwnProperty('dashboard')) {
                delete definition['_ext']['dashboard'];
                if (Object.keys(definition['_ext']).length == 0)
                    delete definition['_ext'];
            }
        }
    }
}