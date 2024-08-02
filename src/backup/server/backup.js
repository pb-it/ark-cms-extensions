const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const appRoot = controller.getAppRoot();
//const common = require(path.join(appRoot, "./src/common/common.js"));
const Logger = require(path.join(appRoot, './src/common/logger/logger.js'));

class Backup {

    static async create(data) {
        Logger.info('[Extension:backup] Creating backup...');
        const uid = crypto.randomBytes(16).toString('hex');
        data['uid'] = uid;

        const fileName = `${uid}.sql`
        const filePath = `backup/${fileName}`;

        const tmpDir = await controller.getTmpDir();
        const tmpFilePath = path.join(tmpDir, fileName);

        //var res = await common.exec(`mysqldump --verbose -u root --add-drop-database --opt --skip-set-charset --default-character-set=utf8mb4 --databases cms > ${tmpFilePath}`);
        await controller.createDatabaseBackup(tmpFilePath);
        if (fs.existsSync(tmpFilePath)) {
            const model = controller.getShelf().getModel('backup');
            const attr = model.getAttribute('file');
            const localPath = controller.getPathForFile(attr);
            if (localPath && fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
                const target = path.join(localPath, filePath);

                fs.copyFileSync(tmpFilePath, target, fs.constants.COPYFILE_EXCL);
                fs.unlinkSync(tmpFilePath);

                data['file'] = { 'filename': filePath };
            } else
                throw new Error("Invalid file storage path!");
        } else
            throw new Error("Creating backup failed!");
        return Promise.resolve(data);
    }
}

module.exports = Backup;