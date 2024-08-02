const path = require('path');
const fs = require('fs');

//const ytdl = require('ytdl-core');
const ytdl = require("@distube/ytdl-core");
//const ytmux = require('ytdl-core-muxer');
const ProgressBar = require('progress');

const appRoot = controller.getAppRoot();
const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

class Youtube {

    _id;
    _url;

    _options;
    _info;
    _video;

    constructor(id) {
        this._id = id;
        this._url = `https://www.youtube.com/watch?v=${id}`;

        this._options = {
            //format: 'mp4'
            filter: 'audioandvideo',
            quality: 'highestvideo',
            requestOptions: {
                headers: {
                    'cookie': "CONSENT=PENDING+094;",
                    'x-youtube-identity-token': "QUFFLUhqbFVIODVJWkY5TnZwV1hsb19ua0NiUjJWX2tBZ3w="
                }
            }
        };

        /*var options = {
            filter: 'audioonly',
            quality: 'highestaudio'
        };*/
    }

    async init() {
        this._info = await ytdl.getInfo(this._url, this._options);
        return Promise.resolve();
    }

    getUrl() {
        return this._url;
    }

    setUrl(url) {
        this._url = url;
    }

    getTitle() {
        var title;
        if (this._info && this._info.videoDetails)
            title = this._info.videoDetails.title;
        return title;
    }

    getChannel() {
        var channel;
        if (this._info && this._info.videoDetails)
            channel = this._info.videoDetails.ownerChannelName;
        return channel;
    }

    async downloadThumbnail(file, id) {
        var downloaded = false;
        if (this._info && this._info.videoDetails && this._info.videoDetails.thumbnails) {
            var thumbnail = this._info.videoDetails.thumbnails.filter(function (x) { return x.width == 1920 })[0];
            if (!thumbnail)
                thumbnail = this._info.videoDetails.thumbnails[this._info.videoDetails.thumbnails.length - 1];
            if (thumbnail && thumbnail !== undefined) {
                try {
                    downloaded = await controller.getWebClientController().getWebClient().download(thumbnail.url, file);
                } catch (err) {
                    console.log(err);
                }
            }
        }
        if (!downloaded) {
            var surl = `http://img.youtube.com/vi/${id}/`;
            var url = `${surl}maxresdefault.jpg`;
            try {
                downloaded = await controller.getWebClientController().getWebClient().download(url, file);
            } catch (err) {
                console.log(err);
            }
            if (!downloaded) {
                url = `${surl}hqdefault.jpg`;
                /*try {
                    downloaded = await controller.getWebClientController().getWebClient().download(url, file);
                } catch (err) {
                    console.log(err);
                }*/
            }
        }
        return Promise.resolve(downloaded);
    }

    async downloadVideo(file) {
        var start = new Date();
        var starttime = start.getTime();
        console.log(start.toISOString());

        var err;
        var writer;
        try {
            await new Promise(function (resolve, reject) {
                writer = fs.createWriteStream(file);
                writer.on('error', error => {
                    writer.close();
                    if (file && fs.existsSync(file))
                        fs.unlinkSync(file);
                    reject(error);
                });
                writer.on('finish', () => {
                    writer.close();
                    if (err) {
                        if (file && fs.existsSync(file))
                            fs.unlinkSync(file);
                    } else {
                        const downloaded_sec = (Date.now() - starttime) / 1000;
                        console.log(downloaded_sec.toFixed(2));
                        resolve();
                    }
                });

                var url = this._url;
                if (process.env.NODE_ENV === "production")
                    ytdl(url, this._options).pipe(writer);
                else {
                    var bar;
                    ytdl(url, this._options)
                        .on('response', function (res) {
                            bar = new ProgressBar('downloading [:bar] :percent :etas', {
                                complete: String.fromCharCode(0x2588),
                                total: parseInt(res.headers['content-length'], 10)
                            });
                        })
                        .on('data', function (data) {
                            bar.tick(data.length);
                        })
                        .on('finish', function () {
                            console.log('\nDownload finished...');
                        }).pipe(writer);
                }
            }.bind(this));
        } catch (error) {
            err = error;
            Logger.parseError(error);
            if (writer)
                writer.close();
            throw new Error("download failed");
        }

        this._video = file;
        return Promise.resolve(true);
    }
}

module.exports = Youtube;