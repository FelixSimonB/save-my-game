const { spawn, exec } = require("child_process");
const path = require("path");

const PORT = 3100;

let nextProcess = null;
let running = false;

function startServer() {
  if (running) return;

  const nextPath = path.join(__dirname, "../save-my-game");

  nextProcess = spawn("npm", ["run", "start", "--", "-p", PORT], {
    cwd: nextPath,
    shell: true,
    windowsHide: true,
    stdio: "ignore"
  });

  running = true;

  nextProcess.on("exit", () => {
    running = false;
    nextProcess = null;
  });

  console.log(`Server running on http://localhost:${PORT}`);
}

function stopServer() {
  if (nextProcess) {
    nextProcess.kill("SIGTERM"); // important on Windows too
    nextProcess = null;
  }

  console.log(`Server stopped`);
  running = false;
  exec("npx kill-port 3100");
}

function getStatus() {
  return running;
}

module.exports = {
  startServer,
  stopServer,
  getStatus,
  PORT
};