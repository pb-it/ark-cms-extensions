const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

const Youtube = require('./server/youtube.js');

async function setup() {
    const data = {};

    const shelf = controller.getShelf();
    var mYoutube = shelf.getModel('youtube');
    var mPlaylist = shelf.getModel('playlist');

    var p;
    var resolved;
    var definition;
    if (!mYoutube) {
        p = path.join(__dirname, 'models/youtube.js');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mYoutube = await shelf.upsertModel(null, definition);
        await mYoutube.initModel();
    }
    if (!mPlaylist) {
        p = path.join(__dirname, 'models/playlist.js');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        mPlaylist = await shelf.upsertModel(null, definition);
        await mPlaylist.initModel();
    }

    const profile = {
        "name": "youtube",
        "menu": [
            "youtube",
            "playlist"
        ]
    };

    var profiles;
    var bUpdate;
    var bPrefix;
    const registry = controller.getRegistry();
    var str = await registry.get('profiles');
    if (str) {
        if (str.startsWith('data:text/javascript;charset=utf-8,')) {
            str = str.substring('data:text/javascript;charset=utf-8,'.length);
            bPrefix = true;
        }
        profiles = JSON.parse(str);
        if (profiles['available']) {
            var bFound;
            for (var x of profiles['available']) {
                if (x['name'] === 'youtube') {
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
    if (bUpdate) {
        if (bPrefix)
            str = 'data:text/javascript;charset=utf-8,' + JSON.stringify(profiles, null, '\t');
        else
            str = JSON.stringify(profiles);
        await registry.upsert('profiles', str);
    }

    return Promise.resolve(data);
}

async function init() {
    const mYoutube = controller.getShelf().getModel('youtube');
    if (mYoutube) {
        mYoutube.setPreCreateHook(async function (data) {
            const uid = data['youtube_id'];
            if (uid) {
                try {
                    const yt = new Youtube(uid);
                    try {
                        await yt.init();
                    } catch (error) {
                        if (error['statusCode'] == 410) {
                            yt.setUrl(yt.getUrl() + '&bpctr=9999999999');
                            console.log('appended');
                            await yt.init();
                            console.log('info ok');
                        } else
                            throw error;
                    }
                    data['title'] = yt.getTitle();
                    var attr = mYoutube.getAttribute('thumbnail');
                    var cdn = controller.getPathForFile(attr);
                    const poster = `${uid}.jpg`;
                    const thumbnail_file = `${cdn}${poster}`;
                    if (!fs.existsSync(thumbnail_file)) {
                        if (await yt.downloadThumbnail(thumbnail_file, uid))
                            data['thumbnail'] = { 'filename': poster };
                        else
                            throw new Error("downloading thumbnail failed");
                    } else
                        throw new Error("File already exists");

                    const mp4 = `${uid}.mp4`;
                    const webm = `${uid}.webm`;
                    attr = mYoutube.getAttribute('file');
                    cdn = controller.getPathForFile(attr);
                    if (!fs.existsSync(`${cdn}${mp4}`) && !fs.existsSync(`${cdn}${webm}`)) {
                        const video_file = `${cdn}${mp4}`;
                        await yt.downloadVideo(video_file);
                        if (fs.existsSync(video_file))
                            data['file'] = { 'filename': mp4 };
                    } else
                        throw new Error("File already exists");
                    return Promise.resolve(data);
                } catch (err) {
                    return Promise.reject(err);
                }
            } else
                return Promise.resolve(data);
        });
        mYoutube.setPreUpdateHook(async function (oldData, newData) {
            try {
                if (newData['youtube_id'] && newData['youtube_id'] != oldData['youtube_id']) {
                    //TODO:
                }
                return Promise.resolve(newData);
            } catch (err) {
                return Promise.reject(err);
            }
        });
    } else
        throw new Error('Model \'youtube\' not defined!');

    return Promise.resolve();
}

module.exports = { setup, init };