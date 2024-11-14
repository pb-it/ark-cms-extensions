const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const semver = require('semver');

const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));
const common = require(path.join(appRoot, './src/common/common.js'));
const base64 = require(path.join(appRoot, './src/common/base64.js'));

const routePublic = {
    'regex': '^/file2/public/(.*)$',
    'fn': async function (req, res, next) {
        var file = req.locals['match'][1];
        var filePath = path.join(__dirname, 'public', file);
        if (fs.existsSync(filePath))
            res.sendFile(filePath);
        else
            next();
        return Promise.resolve();
    }.bind(this)
};

var funcFileName;

async function setup() {
    var data = {};
    data['client-extension'] = fs.readFileSync(path.join(__dirname, 'client.mjs'), 'utf8');
    return Promise.resolve(data);
}

async function init() {

    const ws = controller.getWebServer();
    ws.addExtensionRoute(routePublic);

    ws.addExtensionRoute({
        'regex': '^/file2/init$',
        'fn': async function (req, res, next) {
            await _init();
            res.send('OK');
            return Promise.resolve();
        }.bind(this)
    });

    await _init();

    const dtc = controller.getDataTypeController();
    const createForge = async function (model, attr, data, old, forge) {
        const str = attr['name'];
        if (data[str]) {
            if (attr['storage'] == 'base64') {
                if (data[str]['base64'] && data[str]['base64'].startsWith("data:"))
                    forge[str] = data[str]['base64'];
                else if (data[str]['url'] && data[str]['url'].startsWith("http"))
                    forge[str] = await controller.getWebClientController().getWebClient().getBase64(data[str]['url']);
            } else if (attr['storage'] == 'blob') {
                if (data[str]['blob'])
                    forge[str] = data[str]['blob'];
                else if (data[str]['url'] && data[str]['url'].startsWith("http"))
                    throw new Error('NotImplementedException'); //TODO:
            } else if (attr['storage'] == 'filesystem') {
                const localPath = controller.getPathForFile(attr);
                if (localPath) {
                    const tmpDir = await controller.getTmpDir();
                    var tmpFilePath;
                    var fileName;
                    if (data[str]['filename'])
                        fileName = data[str]['filename'];
                    if (data[str]['base64']) {
                        if (data[str]['base64'].startsWith("data:")) {
                            if (!fileName) {
                                if (typeof attr.funcFileName == 'function')
                                    fileName = await attr.funcFileName(data, old);
                                else if (funcFileName)
                                    fileName = await funcFileName(model, data, old);
                            }
                            if (fileName) {
                                tmpFilePath = path.join(tmpDir, path.basename(fileName));
                                if (fs.existsSync(tmpFilePath))
                                    throw new Error("File already exists!");
                            } else {
                                var ext = base64.getFileExtension(data[str]['base64']);
                                do {
                                    fileName = crypto.randomBytes(16).toString("hex") + '.' + ext;
                                    tmpFilePath = path.join(tmpDir, fileName);
                                } while (fs.existsSync(tmpFilePath));
                            }
                            base64.createFile(tmpFilePath, data[str]['base64']);
                        } else
                            throw new Error("Invalid base64 data!");
                    } else if (data[str]['url']) {
                        if (data[str]['url'].startsWith("http")) {
                            if (data[str]['force'] || !attr['url_prop'] || !old || !old[attr['url_prop']] || old[attr['url_prop']] != data[str]['url']) {
                                if (!fileName) {
                                    if (typeof attr.funcFileName == 'function')
                                        fileName = await attr.funcFileName(data, old);
                                    else if (funcFileName)
                                        fileName = await funcFileName(model, data, old);
                                }
                                if (fileName) {
                                    tmpFilePath = path.join(tmpDir, path.basename(fileName));
                                    if (fs.existsSync(tmpFilePath))
                                        throw new Error("File already exists!");
                                } else {
                                    var uid;
                                    var ext = common.getFileExtensionFromUrl(data[str]['url']);
                                    if (ext) {
                                        ext = ext.toLowerCase();
                                        if (ext === "jpg!d")
                                            ext = "jpg";
                                    }
                                    do {
                                        uid = crypto.randomBytes(16).toString("hex");
                                        if (ext)
                                            fileName = `${uid}.${ext}`;
                                        else
                                            fileName = uid;
                                        tmpFilePath = path.join(tmpDir, fileName);
                                    } while (!tmpFilePath || fs.existsSync(tmpFilePath));
                                }
                                tmp = await controller.getWebClientController().getWebClient().download(data[str]['url'], tmpFilePath);
                                tmpFilePath = path.join(tmpDir, tmp);
                            }
                        } else
                            throw new Error("Invalid URL!");
                    }

                    if (tmpFilePath) {
                        if (old && old[str]) {
                            var oldFile = path.join(localPath, old[str]);
                            if (fs.existsSync(oldFile))
                                fs.unlinkSync(oldFile);
                        }
                        const target = path.join(localPath, fileName);
                        const dir = path.dirname(target);
                        if (dir && !(fs.existsSync(dir) && fs.statSync(dir).isDirectory()))
                            fs.mkdirSync(dir, { recursive: true });
                        // fs.rename fails if two separate partitions are involved
                        if (data[str]['force'])
                            fs.copyFileSync(tmpFilePath, target);
                        else
                            fs.copyFileSync(tmpFilePath, target, fs.constants.COPYFILE_EXCL);
                        fs.unlinkSync(tmpFilePath);
                    } else {
                        if (fileName) {
                            if (old && old[str] && old[str] != fileName) {
                                var oldFile = path.join(localPath, old[str]);
                                var newFile = path.join(localPath, fileName);
                                if (fs.existsSync(oldFile)) {
                                    if (!fs.existsSync(newFile) || data[str]['force']) {
                                        try {
                                            fs.renameSync(oldFile, newFile);
                                        } catch (error) {
                                            if (error['code'] && error['code'] === 'EXDEV') {
                                                if (data[str]['force'])
                                                    fs.copyFileSync(oldFile, newFile);
                                                else
                                                    fs.copyFileSync(oldFile, newFile, fs.constants.COPYFILE_EXCL);
                                                fs.unlinkSync(oldFile);
                                            } else
                                                throw error;
                                        }
                                    } else
                                        throw new Error("File '" + newFile + "' already exists");
                                }
                            }
                        } else {
                            if (old && old[str] && data[str]['delete']) {
                                var file = path.join(localPath, old[str]);
                                if (fs.existsSync(file))
                                    fs.unlinkSync(file);
                            }
                        }
                    }

                    if (fileName)
                        forge[str] = fileName;
                    else
                        forge[str] = null;
                } else
                    throw new Error("Invalid file storage path!");
            }
            if (attr['filename_prop'] && data[str]['filename'])
                forge[attr['filename_prop']] = data[str]['filename'];
            if (attr['url_prop']) {
                if (data[str]['url']) {
                    if (!old || !old[attr['url_prop']] || old[attr['url_prop']] != data[str]['url'])
                        forge[attr['url_prop']] = data[str]['url'];
                } else {
                    if (old && old[attr['url_prop']])
                        forge[attr['url_prop']] = null;
                }
            }
        } else {
            forge[str] = null;
            if (attr['filename_prop'])
                forge[attr['filename_prop']] = null;
            if (attr['url_prop']) {
                forge[attr['url_prop']] = null;
            }
        }
        return Promise.resolve();
    };
    const file2 = {
        'tag': 'file2',
        'add': function (model, table, attribute) {
            var attr = { ...attribute };
            attr['dataType'] = 'string';
            model._addColumn(table, attr);
            return;
        },
        'destroy': async function (attr, data, value) {
            const localPath = controller.getPathForFile(attr);
            if (localPath) {
                const file = path.join(localPath, value);
                if (fs.existsSync(file))
                    fs.unlinkSync(file);
            }
            return Promise.resolve();
        }
    }
    const appVersion = controller.getVersionController().getPkgVersion();
    if (semver.lt(appVersion.toString(), '0.7.4-beta')) {
        file2['createForge'] = async function (attr, data, old, forge) {
            return createForge(null, attr, data, old, forge);
        }
    } else
        file2['createForge'] = createForge;
    dtc.addDataType(file2);

    return Promise.resolve();
}

async function _init() {
    const registry = controller.getRegistry();
    var tmp = await registry.get('ext.file2.funcFileName');
    if (tmp) {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        funcFileName = new AsyncFunction('model', 'data', 'old', tmp);
    } else
        funcFileName = null;
    return Promise.resolve();
}

async function teardown() {
    const ws = controller.getWebServer();
    ws.deleteExtensionRoute(routePublic);

    /*var p = './index.js';
    var resolved = require.resolve(p);
    if (resolved)
        delete require.cache[p];*/

    controller.setRestartRequest();
    return Promise.resolve();
}

module.exports = { setup, init, teardown };