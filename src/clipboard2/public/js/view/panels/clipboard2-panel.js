class Clipboard2Panel extends Panel {

    _data;

    constructor() {
        super();
    }

    async _init() {
        await super._init();

        /*const resources = [];
        const controller = app.getController();
        const apiController = controller.getApiController();
        const origin = apiController.getApiOrigin();
        const publicDir = origin + '/api/ext/helper/public';
        if (typeof Clipboard2 === 'undefined')
            resources.push(loadScript(publicDir + '/js/clipboard2.js'));
        if (resources.length > 0)
            await Promise.all(resources);*/

        this._data = Clipboard2.get();

        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        if (this._data) {
            var $ul = $('<ul/>');
            var $li;
            for (let item of Object.keys(this._data)) {
                $li = $('<li/>');
                $li.append(item);
                $li.append($('<button/>')
                    .text('Edit')
                    .click(async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            const old = Clipboard2.get(item);
                            const value = prompt('Value:', old);
                            if (value && value != old) {
                                Clipboard2.set(item, value);
                                alert('Changed successfully');
                            }
                        } catch (error) {
                            app.getController().showError(error);
                        }
                        return Promise.resolve();
                    }.bind(this)));
                $li.append($('<button/>')
                    .text('Delete')
                    .click(async function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                            Clipboard2.delete(item);
                            await this.render();
                        } catch (error) {
                            app.getController().showError(error);
                        }
                        return Promise.resolve();
                    }.bind(this)));
                $ul.append($li);
            }
            $div.append($ul);
            $div.append('<br>');
        }
        $div.append($('<button/>')
            .text('Add')
            .click(async function (event) {
                event.preventDefault();
                event.stopPropagation();

                try {
                    const key = prompt('Key:');
                    if (key) {
                        const data = Clipboard2.get();
                        if (!data || !data.hasOwnProperty('key') || confirm('Override?')) {
                            const value = prompt('Value:');
                            Clipboard2.set(key, value);
                            await this.render();
                        }
                    }
                } catch (error) {
                    app.getController().showError(error);
                }
                return Promise.resolve();
            }.bind(this)));

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}