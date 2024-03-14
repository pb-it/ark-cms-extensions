class Balance extends Panel {

    constructor() {
        super();
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        const controller = app.getController();
        const ds = controller.getDataService();
        const stocks = await ds.fetchData('stock');
        const stockDict = new Object();
        for (var data of stocks) {
            stockDict[data.id] = data;
        }
        const transactions = await ds.fetchData('transaction');

        var deposit = 0;
        var balance = 0;
        var map = new Map();
        var obj;
        var id;
        for (var transaction of transactions) {
            if (transaction.total)
                balance += transaction.total;
            if (transaction.type === "deposit" || transaction.type === "withdrawal")
                deposit += transaction.total;
            else if (transaction['stock'] && Object.keys(transaction['stock']).length > 0) {
                id = transaction['stock']['id'];
                if (map.has(id)) {
                    obj = map.get(id);
                } else {
                    obj = { 'stock': stockDict[id] };
                    map.set(id, obj);
                }
                if (transaction.type === "buy" || transaction.type === "other") {
                    if (transaction.amount) {
                        if (obj.amount)
                            obj.amount += transaction.amount;
                        else
                            obj.amount = transaction.amount;
                    } else
                        console.log("amount missing");
                } else if (transaction.type === "sell") {
                    if (transaction.amount) {
                        if (obj.amount)
                            obj.amount -= transaction.amount;
                        else
                            obj.amount = -transaction.amount;
                    } else
                        console.log("amount missing");
                }
            }
        }

        var $table = $('<table>');
        var $row;
        var $col;
        var i = 0;
        const arr = [...map.entries()].filter(function (x) { return x[1]['stock'] != undefined });
        const mapAlph = new Map(arr.sort((a, b) => (a[1]['stock']['name'] > b[1]['stock']['name']) ? 1 : ((b[1]['stock']['name'] > a[1]['stock']['name']) ? -1 : 0)));
        var lastPrice;
        var $button;
        for (let [key, value] of mapAlph.entries()) {
            if (value.amount != 0) {
                i++;
                $row = $('<tr>');
                $col = $('<td>').text(value.stock.name);
                $row.append($col);
                $col = $('<td>').text(value.stock.symbol);
                $row.append($col);
                $col = $('<td>').text(value.amount);
                $row.append($col);
                lastPrice = undefined;
                /*try {
                    lastPrice = await stockController.getLastPrice(value.stock);
                } catch (err) {
                    if (err)
                        console.log(err);
                }
                if (!lastPrice)
                    lastPrice = 'n/a';*/
                if (lastPrice)
                    $col = $('<td>').text(lastPrice);
                else {
                    $button = $('<button>')
                        .text('Details')
                        .click(async function (event) {
                            event.stopPropagation();

                            const controller = app.getController();
                            controller.setLoadingState(true);
                            try {
                                await StockController.showCard(value['stock']);
                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }
                            return Promise.resolve();
                        }.bind(this));
                    $col = $('<td>').append($button);
                }
                $row.append($col);
                $table.append($row);
            }
        }

        $div.append("deposit: " + deposit.toFixed(2));
        $div.append("<br>");
        $div.append("balance: " + balance.toFixed(2));
        $div.append("<br>");
        $div.append("<br>");

        $div.append("<h2>Depot:</h2>");
        $div.append($table);
        $div.append("<br>");
        $div.append("<br>");

        $div.append(i);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }
}