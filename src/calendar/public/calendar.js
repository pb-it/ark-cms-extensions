class Calendar extends Panel {

    static createObserver(containerSelector, elementSelector, callback) {
        const onMutationsObserved = function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length) {
                    var elements = $(mutation.addedNodes).find(elementSelector);
                    for (var i = 0, len = elements.length; i < len; i++) {
                        callback(elements[i]);
                    }
                }
            });
        };
        const target = $(containerSelector)[0];
        const config = { childList: true, subtree: true };
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        const observer = new MutationObserver(onMutationsObserved);
        observer.observe(target, config);
        return observer;
    }

    _observer;

    _data;

    constructor(data) {
        super();
        if (data)
            this._data = data;
    }

    async _init() {
        await super._init();

        this._observer = Calendar.createObserver('body', '#calendar', async function (element) {
            if (typeof EvoCalender === 'undefined') {
                const resources = [];
                const cdn = "https://cdn.jsdelivr.net/npm/evo-calendar@1.1.2/evo-calendar";
                resources.push(loadScript(cdn + "/js/evo-calendar.min.js"));
                // resources.push(loadStyle(cdn + "/css/evo-calendar.min.css"));

                const apiController = controller.getApiController();
                const origin = apiController.getApiOrigin();
                const publicDir = origin + "/api/ext/calendar/public";
                resources.push(loadStyle(publicDir + "/css/evo-calendar.css"));
                await Promise.all(resources);
            }

            $("#calendar").evoCalendar({
                calendarEvents: this._data
            });

            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
            return Promise.resolve();
        }.bind(this));

        const controller = app.getController();
        try {
            const ds = controller.getDataService();
            if (!this._data) {
                var tmp = await ds.fetchData('calendar-entries');
                this._data = tmp.map(function (x) { return { 'name': x['title'], 'date': x['datetime'], 'description': x['info'] } });
            }
        } catch (error) {
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        $div.append('<div id="calendar"></div>');

        const $d = $('<div/>')
            .css({ 'float': 'right' });
        $d.append('<a href="https://edlynvillegas.github.io/evo-calendar/">evo-calendar</a>');
        $div.append($d);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}