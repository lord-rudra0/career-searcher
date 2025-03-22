const { spawn } = require('child_process');
const path = require('path');

let expressProcess = null;
let pythonProcess = null;

const startFlask = () => {
    console.log('Starting Flask server...');
    pythonProcess = spawn('venv/bin/python', ['app.py'], {
        cwd: path.join(__dirname),
        stdio: 'inherit'
    });

    pythonProcess.on('error', (err) => {
        console.error('Flask API Error:', err);
    });

    pythonProcess.on('exit', (code) => {
        console.log(`Flask API exited with code ${code}`);
        if (expressProcess) expressProcess.kill();
        process.exit();
    });
};

const startExpress = () => {
    console.log('Starting Express server...');
    expressProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname),
        stdio: 'inherit'
    });

    expressProcess.on('error', (err) => {
        console.error('Express Server Error:', err);
    });

    expressProcess.on('exit', (code) => {
        console.log(`Express server exited with code ${code}`);
        if (pythonProcess) pythonProcess.kill();
        process.exit();
    });
};

// Start servers
startFlask();
setTimeout(startExpress, 2000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down servers...');
    if (pythonProcess) pythonProcess.kill();
    if (expressProcess) expressProcess.kill();
    process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    if (pythonProcess) pythonProcess.kill();
    if (expressProcess) expressProcess.kill();
    process.exit(1);
});

console.log('Starting servers...'); 