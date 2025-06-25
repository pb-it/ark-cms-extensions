const path = require('path');
const fs = require('fs');

const appRoot = controller.getAppRoot();
const common = require(path.join(appRoot, './src/common/common.js'));
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

class YtDlpNative {

    constructor() {
    }

    async download(url, file, options, logfile) {
        return new Promise(async function (resolve, reject) {
            try {
                var cmd = `yt-dlp`; // `/usr/local/bin/yt-dlp`
                if (options)
                    cmd += ` ${options}`;
                cmd += ` -o \"${file}.%(ext)s\" \"${url}\"`;
                Logger.info("[App] Executing command '" + cmd + "'");
                const response = await common.exec(cmd);
                fs.writeFileSync(logfile, response);
                var f;
                if (fs.existsSync(file + '.mp4'))
                    f = file + '.mp4';
                else if (fs.existsSync(file + '.webm'))
                    f = file + '.webm';
                resolve(f);
            } catch (error) {
                reject(error);
            }
        }.bind(this));
    }
}

module.exports = YtDlpNative;