class DashboardController {

    static initDashboard(model) {
        const code = DashboardController.getCode(model.getDefinition());
        if (code) {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            model['createDashboard'] = new AsyncFunction(code);
        } else
            delete model['createDashboard'];
        if (typeof model['createDashboard'] === 'function') {
            const entries = model.getSideMenuEntries();
            entries.push({
                'name': 'Dashboard',
                'click': function (event, item) {
                    const state = new State();
                    state['customRoute'] = '/dashboard/' + this.getName();
                    app.getController().loadState(state, true);
                }.bind(model)
            });
        }

        const tabs = model.getConfigTabs();
        tabs.push(new DashboardConfigTab(model));
    }

    static getCode(definition) {
        var code;
        if (definition.hasOwnProperty('extensions') && definition['extensions'].hasOwnProperty('dashboard') && definition['extensions']['dashboard'].hasOwnProperty('strDashboard'))
            code = definition['extensions']['dashboard']['strDashboard'];
        return code;
    }

    static async updateDashboard(model, code) {
        const def = model.getDefinition();
        DashboardController.updateDefinition(def, code);
        await model.setDefinition(def);

        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        model['createDashboard'] = new AsyncFunction(code);

        const entries = model.getSideMenuEntries();
        if (entries.length == 0) {
            entries.push({
                'name': 'Dashboard',
                'click': function (event, item) {
                    const state = new State();
                    state['customRoute'] = '/dashboard/' + this.getName();
                    app.getController().loadState(state, true);
                }.bind(model)
            });
        }
        return Promise.resolve();
    }

    static updateDefinition(definition, code) {
        if (code) {
            const config = { 'strDashboard': code };
            if (definition.hasOwnProperty('extensions'))
                definition['extensions']['dashboard'] = config;
            else
                definition['extensions'] = { 'dashboard': config };
        } else if (definition.hasOwnProperty('extensions')) {
            if (definition['extensions'].hasOwnProperty('dashboard'))
                delete definition['extensions']['dashboard'];
        }
    }
}