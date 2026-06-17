const { app } = require("electron");
const {
  startServer,
  stopServer,
  getStatus,
  PORT
} = require("./server");

function createTray(deps) {
  const { Tray } = require("electron");
  const path = require("path");

  tray = new Tray(path.join(__dirname, "icon.png"));

  tray.setToolTip("Save My Game");

  updateTray(deps);

  // 🔥 optional auto refresh every 2 seconds
  setInterval(() => {
    updateTray(deps);
  }, 2000);
}

app.whenReady().then(() => {
  startServer();

  createTray({
    startServer,
    stopServer,
    getStatus,
    PORT
  });
});

// 🔥 safety shutdowns
app.on("before-quit", () => {
  stopServer();
});

app.on("window-all-closed", (e) => {
  e.preventDefault(); // tray-only app
});

process.on("exit", () => {
  stopServer();
});

process.on("SIGINT", () => {
  stopServer();
  app.quit();
});

function updateTray({ startServer, stopServer, getStatus, PORT }) {
  const { Menu } = require("electron");

  const running = getStatus();

  const menu = Menu.buildFromTemplate([
    {
      label: "SAVE-MY-GAME",
      enabled: false
    },
    { type: "separator" },
    {
      label: running ? "🟢 Running" : "🔴 Stopped",
      enabled: false
    },
    { type: "separator" },

    {
      label: "Start Server",
      enabled: !running,
      click: () => {
        startServer();
        updateTray({ startServer, stopServer, getStatus, PORT });
      }
    },
    {
      label: "Stop Server",
      enabled: running,
      click: () => {
        stopServer();
        updateTray({ startServer, stopServer, getStatus, PORT });
      }
    },

    {
      label: "Open",
      click: () => require("electron").shell.openExternal(`http://localhost:${PORT}`)
    },

    { type: "separator" },
    {
      label: "Quit",
      click: () => require("electron").app.quit()
    }
  ]);

  tray.setContextMenu(menu);
}