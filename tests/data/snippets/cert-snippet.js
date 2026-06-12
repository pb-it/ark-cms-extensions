var result;

const path = require('path');
const fs = require('fs');

try {
    const appRoot = controller.getAppRoot();
    const source = path.join(appRoot, './config/ssl/cert.pem');
    const target = path.join(appRoot, './extensions/axios-webclient/ssl/cert.pem');
    fs.copyFileSync(source, target);
    result = 'OK';
} catch (error) {
    result = 'ERROR';
}

return Promise.resolve(result);