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

const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./data.db",
  },
  debug: true,
});

// const DB = BaseDB("database");

// const SONGS_TABLE = DB.collection({
//   name: "Songs",
// });
// const ALBUMS_TABLE = BaseDB("albums").collection({
//   name: "Albums",
// });
knex.schema.hasTable("songs").then((exsits) => {
  if (!exsits) {
    return knex.schema.createTable("songs", (t) => {
      t.increments("primkey").primary(),
        t.string("title"),
        t.string("artist"),
        t.string("album"),
        t.string("id"),
        t.date("date"),
        t.string("path"),
        t.string("spotify_id");
    });
  }
});
knex.schema.hasTable("albums").then((exsits) => {
  if (!exsits) {
    return knex.schema.createTable("albums", (t) => {
      t.increments("id").primary(),
        t.string("name"),
        t.string("artist"),
        t.string("cover");
    });
  }
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

const writeToDB = async (song, cover) => {
  if (!knex("songs").where({ path: song.path })._eventsCount) {
    let album_cover = knex("albums")
      .where({
        artist: song.artist,
        name: song.album,
      })
      .select("cover");
    if (!album_cover._eventsCount) {
      album_cover = await Buffer.from(
        await sharp(cover).resize(40).toBuffer()
      ).toString("base64");
      const new_album = {
        artist: song.artist,
        name: song.album,
        cover: album_cover,
      };
      await knex("albums").insert(new_album);
    }
    await knex("songs").insert(song);
    song.cover = album_cover;
    win.webContents.send("add-song-to-list", song);
  } else {
    console.log(song.title);
  }
  // if (!(await SONGS_TABLE.findOne({ path: song.path }))) {
  //   let album_cover = await ALBUMS_TABLE.findOne({
  //     name: song.album,
  //     artist: song.artist,
  //   }).cover;
  //   if (!album_cover) {
  //     album_cover = await Buffer.from(
  //       await sharp(cover).resize(40).toBuffer()
  //     ).toString("base64");
  //     const new_album = {
  //       artist: song.artist,
  //       name: song.album,
  //       cover: album_cover,
  //     };

  //     await ALBUMS_TABLE.set(new_album)
  //       .then(() => console.log("test"))
  //       .catch((err) => console.error(err));
  //   }
  //   await SONGS_TABLE.set(song);
  //   song.cover = album_cover;
  //   win.webContents.send("add-song-to-list", song);
  // }
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
            spotify_id: "",
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
