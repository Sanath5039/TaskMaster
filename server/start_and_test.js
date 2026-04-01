const { spawn } = require('child_process');
const http = require('http');

console.log('Starting server...');
const serverProcess = spawn('node', ['server.js'], { stdio: 'pipe' });

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  // When server is up, make the request
  if (data.toString().includes('running on port')) {
    console.log('Server started, making request...');
    makeRequest();
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error("Server STDERR:", data.toString());
});

function makeRequest() {
  const req = http.request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Login Response:', res.statusCode, body);
        serverProcess.kill();
        process.exit(0);
      });
    }
  );

  req.on('error', (e) => {
    console.error('Request Error:', e.message);
    serverProcess.kill();
    process.exit(1);
  });

  req.write(JSON.stringify({
    email: 'sanathkumar017@gmail.com',
    password: 'Password123!' // Doesn't matter if it's wrong, we want to see if it 500s or 401s
  }));
  req.end();
}

setTimeout(() => {
  console.log("Timeout! Server Output:", serverOutput);
  serverProcess.kill();
  process.exit(1);
}, 15000);
