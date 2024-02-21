const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');

    const shelf = controller.getShelf();
    var p;
    var resolved;
    var definition;
    var mStock = shelf.getModel('stock');
    if (!mStock) {
        p = path.join(__dirname, 'models/stock.json');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mStock = await shelf.upsertModel(null, definition);
        await mStock.initModel();
    }
    var mTransaction = shelf.getModel('transaction');
    if (!mTransaction) {
        p = path.join(__dirname, 'models/transaction.json');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mTransaction = await shelf.upsertModel(null, definition);
        await mTransaction.initModel();
    }

    var model = controller.getShelf().getModel('_extension');
    if (model) {
        tmp = await model.readAll({ 'name': 'scraper' });
        if (tmp && tmp.length == 1) {
            model = controller.getShelf().getModel('scraper');
            if (model) {
                tmp = await model.readAll({ 'domain': 'www.finanzen.net' });
                if (!tmp || tmp.length != 1) {
                    const funcScrape = async function (url, doc, data) {
                        var data = {};
                        var title = doc.querySelector("meta[property='og:title']").getAttribute("content");
                        var index = title.toLowerCase().indexOf('aktie');
                        if (index > 0)
                            data['name'] = title.substring(0, index - 1);
                        else
                            data['name'] = title;
                        var badge = doc.querySelectorAll("div.badge-bar > h2.badge");
                        if (badge) {
                            var txt;
                            var val;
                            var children;
                            for (var i = 0; i < badge.length; i++) {
                                children = badge[i].children;
                                if (children.length >= 2) {
                                    txt = children[0].innerText;
                                    val = children[1].innerText;
                                    if (txt === "WKN") data['wkn'] = val;
                                    else if (txt === "ISIN") data['isin'] = val;
                                    else if (txt === "Symbol") data['symbol'] = val;
                                }
                            }
                        }
                        return Promise.resolve(data);
                    };
                    const str = funcScrape.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].trim();
                    const options = {
                        'headers': {
                            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0'
                        }
                    };
                    const data = {
                        'domain': 'www.finanzen.net',
                        'options': options,
                        'funcScrape': str
                    };
                    await model.create(data);
                    Logger.info('[Extension - stocks] Created scraper');
                }
            }
        }
    }

    const profile = {
        "name": "stocks",
        "menu": [
            "Balance",
            "stock",
            "transaction"
        ]
    };
    var profiles;
    var bUpdate;
    const registry = controller.getRegistry();
    var str = await registry.get('profiles');
    if (str) {
        profiles = JSON.parse(str);
        if (profiles['available']) {
            var bFound;
            for (var x of profiles['available']) {
                if (x['name'] === 'stocks') {
                    bFound = true;
                    break;
                }
            }
            if (!bFound) {
                profiles['available'].push(profile);
                bUpdate = true;
            }
        }
    } else {
        profiles = {
            "available": [profile]
        };
        bUpdate = true;
    }
    if (bUpdate)
        await registry.upsert('profiles', JSON.stringify(profiles));

    return Promise.resolve(data);
}

async function init() {
    const ws = controller.getWebServer();
    ws.addExtensionRoute(
        {
            'regex': '^/stocks/public/(.*)$',
            'fn': async function (req, res, next) {
                var file = req.locals['match'][1];
                var filePath = path.join(__dirname, 'public', file);
                if (fs.existsSync(filePath))
                    res.sendFile(filePath);
                else
                    next();
                return Promise.resolve();
            }.bind(this)
        }
    );
    return Promise.resolve();
}

module.exports = { setup, init };