# Operations Manual

> The API servers WebClient is used for forwarding requests(default: Fetch)

##  Browser

```js
var url = 'https://www.google.at';
var res = await HttpProxy.request(url);
```

## SERVER

### API

body(json):
```js
{
    "url": <url>
    "options": {
        "method": <GET/POST>,
        ...
    }
}
```
'POST' body to `/api/ext/http-proxy/forward`