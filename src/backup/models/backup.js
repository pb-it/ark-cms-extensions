const definition = {
    "name": "backup",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "defaults": {
        "title": "title",
        "sort": "created_at:desc"
    },
    "attributes": [
        {
            "name": "uid",
            "length": 32,
            "unique": true,
            "dataType": "string",
            "readonly": true
        },
        {
            "name": "title",
            "dataType": "string",
            "persistent": false,
            "hidden": true
        },
        {
            "name": "file",
            "dataType": "file2",
            "length": 250,
            "unique": true,
            "storage": "filesystem",
            "cdn": "/cdn",
            "readonly": true,
            "persistent": true,
            "bCustomFilename": false
        },
        {
            "name": "description",
            "size": "20",
            "dataType": "text"
        }
    ],
    "extensions": {
    }
}

definition['extensions']['client'] = `function init() {
    this._prepareDataAction = function (data) {
        const date = new Date(data['created_at']);
        var title = date.toLocaleString(app.getController().getLocale());
        if (data['description']) {
            if (data['description'].length > 40)
                title += ' - ' + data['description'].substring(0, 37) + '...';
            else
                title += ' - ' + data['description'];
        }
        data['title'] = title;
        return data;
    }
}

export { init };`;

module.exports = definition;