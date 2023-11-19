const os = require('os');

var cmd;
if (os.type() === 'Linux' || os.type() === 'Darwin')
    cmd = './build.sh';
else if (os.type() === 'Windows_NT')
    cmd = 'build.bat';
if (cmd) {
    require('child_process').exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(stdout);
    });
}