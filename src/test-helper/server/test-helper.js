const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const processController = controller.getExtensionController().getExtension('process')['module'].getProcessController();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const block = delay => {
    const start = (new Date()).getTime();
    while (((new Date()).getTime() - start) <= delay) { }
}

class TestHelper {

    static _instance;

    static initRoutes(ws) {
        const testhelper = new TestHelper();
        ws.addExtensionRoute(
            {
                'regex': '^/test-helper/sleep$',
                'fn': testhelper.sleep
            }
        );
        ws.addExtensionRoute(
            {
                'regex': '^/test-helper/echo$',
                'fn': TestHelper.echo
            }
        );
    }

    static async sleep(process, seconds, blocking) {
        var logfile;
        var io;
        if (process) {
            logfile = process.getLogfile();
            io = process.getSocket();
        }

        var msg = 'start: ' + new Date().toISOString();
        if (logfile)
            fs.appendFileSync(logfile, msg + '\n');
        else
            console.log(msg);
        if (io)
            io.emit('chat message', msg);

        if (blocking) {
            await sleep(100); // prevent blocking of own response in case of batched task
            block(seconds * 1000 - 100);
        } else
            await controller.getDatabaseController().getKnex().raw("SELECT SLEEP(" + seconds + ");");

        msg = 'end: ' + new Date().toISOString();
        if (logfile)
            fs.appendFileSync(logfile, msg + '\n');
        else
            console.log(msg);
        if (io)
            io.emit('chat message', msg);

        return Promise.resolve('done');
    }

    static async echo(req, res) {
        var msg;
        if (req.query)
            msg = req.query['message'];
        if (msg)
            res.send(msg);
        else {
            res.status(500);
            res.send('Missing message');
        }
        return Promise.resolve();
    }

    constructor() {
        if (TestHelper._instance)
            return TestHelper._instance;
        TestHelper._instance = this;
    }

    /**
     * Process with blocking sleep for testing multithreading
     */
    async sleep(req, res) {
        var process;
        try {
            var query = { ...req.query };
            var redirect;
            if (query['_redirect']) {
                redirect = query['_redirect'];
                delete query['_redirect'];
            }
            var batch;
            if (query['_batch']) {
                batch = query['_batch'] === 'true';
                delete query['_batch'];
            }
            var seconds;
            if (query['seconds']) {
                seconds = query['seconds'];
                delete query['seconds'];
            }
            var blocking;
            if (query['blocking']) {
                blocking = query['blocking'] === 'true';
                delete query['blocking'];
            }
            if (seconds) {
                if (batch) {
                    process = processController.createProcess();
                    if (process) {
                        process['name'] = 'sleep';
                        TestHelper.sleep(process, seconds, blocking).then((result) => {
                            console.log(result);
                            process['result'] = result;
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
                        if (redirect)
                            res.redirect(process.getUrl());
                        else
                            res.json(process.getData());
                    } else
                        throw new Error('Creating process failed');
                } else {
                    var result = await TestHelper.sleep(null, seconds, blocking);
                    res.send(result);
                }
            } else
                throw new Error('Missing duration');
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

module.exports = TestHelper;