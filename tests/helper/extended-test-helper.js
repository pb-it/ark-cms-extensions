const path = require('path');
const fs = require('fs');

const assert = require('assert');

const { TestHelper } = require("@pb-it/ark-cms-selenium-test-helper");

class ExtendedTestHelper extends TestHelper {

    constructor() {
        super();
    }

    async setupModel(file) {
        const str = fs.readFileSync(file, 'utf8');
        const model = JSON.parse(str);
        return this.getApp().getModelController().addModel(model);
    }

    async setupData(model, file, bExlusive) {
        const str = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(str);
        return this._setupData(model, data, bExlusive);
    }

    async _setupData(model, data, bExlusive) {
        const ds = this.getApp().getDataService();
        if (bExlusive) {
            var tmp = await ds.read(model);
            if (tmp.length > 0) {
                for (var entry of tmp) {
                    await ds.delete(model, entry['id']);
                }
            }
        }
        var res;
        for (var entry of data) {
            res = await ds.create(model, entry);
            assert.notEqual(Object.keys(res).length, 0);
        }
        return Promise.resolve();
    }

    async setupScenario(scenario) {
        switch (scenario) {
            case 1:
                const app = this.getApp();
                const ds = app.getDataService();
                const models = await ds.read('_model');

                //TODO:

                break;
            default:
        }

        return Promise.resolve();
    }
}

module.exports = ExtendedTestHelper;