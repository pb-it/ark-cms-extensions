const definition = {
    "name": "http-proxy-cache",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "url",
            "length": "2000",
            "dataType": "url"
        },
        {
            "name": "body",
            "length": "20000000",
            "dataType": "text"
        }
    ],
    "defaults": {
        "title": "url"
    },
    "bConfirmFullFetch": true
}

module.exports = definition;