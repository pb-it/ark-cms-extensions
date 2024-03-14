class StockCard extends Panel {

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

    _chartConfig;
    _observer;

    constructor(chartConfig) {
        super();
        this._chartConfig = chartConfig;
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const $chart = $('<canvas/>')
            .addClass('stockChart')
            .attr('id', 'stockChart')
            .css({
                'width': '1000',
                'height': '600'
            });
        $div.append($chart);

        this._observer = StockCard.createObserver('body', '#stockChart', async function (element) {
            if (this._chartConfig) {
                if (typeof Chart === 'undefined')
                    await loadScript('https://cdn.jsdelivr.net/npm/chart.js');

                const ctx = document.getElementById('stockChart').getContext("2d");
                new Chart(ctx, this._chartConfig);
                if (this._observer) {
                    this._observer.disconnect();
                    this._observer = null;
                }
            }
            return Promise.resolve();
        }.bind(this));

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}