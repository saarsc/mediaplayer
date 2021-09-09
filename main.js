` TODO
  --------------
  1) albums DB which stores id, cover, artist, general info
  2) songs DB with (song name, id and album id which points to the album DB, lyrics?)
  3) ASYNC the file playing 
  4) UI UI UI 
  5) Spotify integration

`;
const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

const path = require("path");

const mm = require("music-metadata");
const uuid = require("uuid");

const BaseDB = require("dbd.db");
const sharp = require("sharp");

let win;

const DB = BaseDB("database");

const SONGS_TABLE = DB.collection({
  name: "Songs",
});
const ALBUMS_TABLE = BaseDB("albums").collection({
  name: "Albums",
});

async function* listFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* listFiles(res);
    } else {
      const ext = path.extname(res).toLowerCase();
      if (ext === ".flac" || ext === ".mp3") {
        yield res;
      }
    }
  }
}
let songList = [];
const SONG_LIST_PATH = path.join(__dirname, `songsList.json`);

fs.access(SONG_LIST_PATH, (err) => {
  if (!err) {
    songList = JSON.parse(fs.readFileSync(SONG_LIST_PATH));
    return;
  }
});

const writeToDB = async (song, cover) => {
  if (!(await SONGS_TABLE.findOne({ path: song.path }))) {
    let album_cover = await ALBUMS_TABLE.findOne({
      name: song.album,
      artist: song.artist,
    }).cover;
    if (!album_cover) {
      album_cover = await Buffer.from(
        await sharp(cover).resize(40).toBuffer()
      ).toString("base64");
      const new_album = {
        artist: song.artist,
        name: song.album,
        cover: album_cover,
      };

      await ALBUMS_TABLE.set(new_album)
        .then(() => console.log("test"))
        .catch((err) => console.error(err));
    }
    await SONGS_TABLE.set(song);
    song.cover = album_cover;
    win.webContents.send("add-song-to-list", song);
  }
  // songList.push(song);
  // fs.writeFileSync(JSON.stringify(songList));
};

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile("index.html");
  win.webContents.openDevTools();
  //   win.webContents.openDevTools();
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
    (async () => {
      for await (const f of listFiles(result.filePaths[0])) {
        await mm.parseFile(f).then((metadata) => {
          const song = {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            id: uuid.v4(),
            date: metadata.common.date,
            path: f,
            spotifyId: "",
          };
          writeToDB(song, metadata.common.picture[0].data);
        });
      }
    })();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
