const fs = require('fs');

const ytdl = require('ytdl-core');
//const ytdl = require("@distube/ytdl-core");
//const ytmux = require('ytdl-core-muxer');
//const ProgressBar = require('progress');

class YtdlCore {

    constructor() {
    }

    async download(url, file, options) {
        return new Promise(async function (resolve, reject) {
            try {
                const writer = fs.createWriteStream(file);
                writer.on('error', error => {
                    writer.close();
                    throw error;
                });
                writer.on('finish', () => {
                    writer.close();
                    if (!err)
                        resolve(file);
                });
                ytdl(url, options).pipe(writer);
            } catch (error) {
                reject(error);
            }
        }.bind(this));
    }
}

module.exports = YtdlCore;