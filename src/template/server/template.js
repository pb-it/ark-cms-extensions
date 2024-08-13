const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const processController = controller.getExtensionController().getExtension('process')['module'].getProcessController();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Template {

    static _instance;

    static initRoutes(ws) {
        const template = new Template();
        ws.addExtensionRoute(
            {
                'regex': '^/template/echo$',
                'fn': Template.echo
            }
        );
        ws.addExtensionRoute(
            {
                'regex': '^/template/process$',
                'fn': template.process
            }
        );
    }

    static async echo(req, res) {
        var msg;
        if (req.query)
            msg = req.query['message'];
        if (msg) {
            res.send(msg);
        } else {
            res.status(500);
            res.send('Missing message');
        }
        return Promise.resolve();
    }

    constructor() {
        if (Template._instance)
            return Template._instance;
        Template._instance = this;
    }

    async process(req, res) {
        var process;
        try {
            process = processController.createProcess();
            if (process) {
                process['name'] = 'sleep';
                sleep(1000).then((result) => {
                    process['result'] = 'END';
                    process['state'] = 'finished';
                }).catch((error) => {
                    //console.error(error);
                    Logger.parseError(error);
                    if (process) {
                        process['result'] = 'error';
                        if (process['state'] != 'finished')
                            process['state'] = 'finished';
                    }
                });
                res.redirect(process.getUrl());
            } else
                throw new Error('Creating process failed');
        } catch (error) {
            Logger.parseError(error);
            if (process) {
                process['result'] = 'error';
                if (process['state'] != 'finished')
                    process['state'] = 'finished';
            }
            if (!res.headersSent) {
                res.status(500); // Internal Server Error
                if (error['message'])
                    res.send(error['message']);
                else
                    res.send('An unexpected error has occurred');
            }
        }
        if (!res.headersSent) {
            res.status(500); // Internal Server Error
            res.send('An unexpected error has occurred');
        }
        return Promise.resolve();
    }
}

module.exports = Template;