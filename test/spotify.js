const { app, BrowserWindow, dialog, ipcMain, session } = require("electron");
const spotify = require("../scripts/spotify");
QUnit.module(spotify);

QUnit.log((details) => {
  if (details.result) {
    console.log(`[PASS] ${JSON.stringify(details.actual)}`);
    return;
  }

  let output = `[FAILED] ${details.module} > ${details.name}`;

  if (details.message) {
    output += `: ${details.message}`;
  }
  if (details.actual) {
    output += `\nexpected: ${details.expected}\nactual: ${details.actual}`;
  }
  if (details.source) {
    output += `\n${details.source}`;
  }

  console.log(output);
});

QUnit.test("Search Songs", (assert) => {
  spotify.connect();
  assert.notEqual(
    spotify.getTrackId({
      title: "Life Is For Living",
      artist: "Coldplay",
      album: "Parachutes",
    }),
    []
  );
});
