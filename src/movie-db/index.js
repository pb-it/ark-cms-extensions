const path = require('path');
const fs = require('fs');

//const appRoot = controller.getAppRoot();
//const Logger = require(path.join(appRoot, "./src/common/logger/logger.js"));

async function setup() {
    const manifest = require(path.join(__dirname, 'manifest.json'));
    const version = 'movie-db@' + manifest['version'];
    const shelf = controller.getShelf();
    var bUpdated;
    var p;
    var resolved;
    var definition;
    var mMovie = shelf.getModel('movie');
    if (!mMovie) {
        p = path.join(__dirname, 'models/movie.json');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        definition['version'] = version;
        mMovie = await shelf.upsertModel(null, definition);
        await mMovie.initTables(false);
        bUpdated = true;
    }
    var mStudio = shelf.getModel('studio');
    if (!mStudio) {
        p = path.join(__dirname, 'models/studio.json');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        definition['version'] = version;
        mStudio = await shelf.upsertModel(null, definition);
        await mStudio.initTables(false);
        bUpdated = true;
    }
    var mStar = shelf.getModel('star');
    if (!mStar) {
        p = path.join(__dirname, 'models/star.json');
        resolved = require.resolve(p);
        if (resolved)
            delete require.cache[resolved];
        definition = require(p);
        definition['version'] = version;
        mStar = await shelf.upsertModel(null, definition);
        await mStar.initTables(false);
        bUpdated = true;
    }
    if (bUpdated) {
        await mMovie.initModel();
        await mStudio.initModel();
        await mStar.initModel();
    }

    var tmp = await mMovie.readAll();
    if (tmp.length == 0) {
        const movies = JSON.parse(fs.readFileSync(path.join(__dirname, './data/movies.json'), 'utf8'));
        for (var movie of movies) {
            tmp = await mMovie.create(movie);
        }
    }
    tmp = await mStudio.readAll();
    if (tmp.length == 0) {
        const studios = JSON.parse(fs.readFileSync(path.join(__dirname, './data/studios.json'), 'utf8'));
        for (var studio of studios) {
            tmp = await mStudio.create(studio);
        }
    }
    tmp = await mStar.readAll();
    if (tmp.length == 0) {
        const stars = JSON.parse(fs.readFileSync(path.join(__dirname, './data/stars.json'), 'utf8'));
        for (var star of stars) {
            tmp = await mStar.create(star);
        }
    }

    const profile = {
        "name": "movie-db",
        "menu": [
            "movie",
            "studio",
            "star"
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
                if (x['name'] === 'movie-db') {
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

    return Promise.resolve();
}

module.exports = { setup };