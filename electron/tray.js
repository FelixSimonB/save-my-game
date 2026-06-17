const { Tray, Menu, app, shell } = require("electron");
const path = require("path");

module.exports = function ({ startServer, stopServer, getStatus, PORT }) {
  const tray = new Tray(path.join(__dirname, "icon.png"));

  function menu() {
    const running = getStatus();

    return Menu.buildFromTemplate([
      {
        label: running ? "🟢 Running" : "🔴 Stopped",
        enabled: false
      },
      { type: "separator" },

      { label: "Start", click: startServer },
      { label: "Stop", click: stopServer },

      {
        label: "Open",
        click: () => shell.openExternal(`http://localhost:${PORT}`)
      },

      { type: "separator" },
      { label: "Quit", click: () => app.quit() }
    ]);
  }

  tray.setToolTip("Save My Game");
  tray.setContextMenu(menu());
};