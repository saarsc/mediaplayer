const sharp = require("sharp");

const sqlite = require("sqlite");
const sqlite3 = require("sqlite3").verbose();

const SONGS_TABLE = "songs";
const ALBUMS_TABLE = "albums";
const SPOTIFY_TABLE = "albums";
let db;

const loadDB = async () => {
  db = await sqlite.open({
    filename: "data.db",
    driver: sqlite3.Database,
  });
  await db.run(
    `CREATE TABLE IF NOT EXISTS ${SONGS_TABLE} ('primkey' INTEGER PRIMARY KEY, 'title' TEXT, 'artist' TEXT, 'album' TEXT, 'id' TEXT, 'date' DATE, 'path' TEXT, 'spotify_id' TEXT)`
  );
  await db.run(
    `CREATE TABLE IF NOT EXISTS ${ALBUMS_TABLE} ('primkey' INTEGER PRIMARY KEY, 'name' TEXT, 'artist' TEXT, 'cover' TEXT)`
  );
};
/**
 * @function
 *
 * Returns album cover. If exsist from DB else process it.
 *
 * @param {string} name album name
 * @param {string} artist album artist to handle two albums with the same name
 * @param {string} cover - optional. image to insert to DB
 * @returns {string} album cover in base64
 */
const getAlbumCover = async (name, artist, cover) => {
  return db
    .get(`SELECT cover FROM albums WHERE artist = $artist AND name = $name`, {
      $artist: artist,
      $name: name,
    })
    .then(async (result) => {
      let album_cover = result;

      if (!album_cover) {
        album_cover = await Buffer.from(
          await sharp(cover).resize(100).toBuffer()
        ).toString("base64");
        const new_album = {
          artist: artist,
          name: name,
          cover: album_cover,
        };
        await db.run(
          `INSERT INTO ${ALBUMS_TABLE} (name,artist,cover) VALUES (?,?,?)`,
          [new_album.name, new_album.artist, new_album.cover]
        );
      } else {
        album_cover = album_cover.cover;
      }
      return album_cover;
    });
};

/**
 * @function Adds a song to the songs DB.
 *
 *
 * @param {object} song new song to add to the db. holds data from the metadata of the file.
 * @param {string} song.title song title
 * @param {string} song.artist song artist
 * @param {string} song.album song album
 * @param {string} song.id uniqe ID for the song
 * @param {string} song.date date the song was released
 * @param {string} song.path local path for the song
 * @param {string} song.cover cover art of the song
 *
 */
async function* writeToDB(song) {
  if (
    await db.get(`SELECT path from ${SONGS_TABLE} WHERE path = ?`, song.path)
  ) {
    // Update spotify ID if dosen't already exists
    if (song.path.startsWith("http")) {
      updateSpotifyid(song);
    }
  } else {
    await db.run(
      `INSERT INTO ${SONGS_TABLE} (title,artist,album,id,date,path,spotify_id) VALUES (?,?,?,?,?,?,?)`,
      [
        song.title,
        song.artist,
        song.album,
        song.id,
        song.date,
        song.path,
        song.path.startsWith("http") ? song.id : "",
      ]
    );
    song.cover = await getAlbumCover(song.album, song.artist, song.cover);
    yield song;
  }
}
const updateSpotifyId = async (song) => {
  if (
    !(await db.get(
      `SELECT * FROM ${SONGS_TABLE} WHERE  spotify_id = ?`,
      song.id
    ))
  ) {
    db.run(
      `UPDATE ${SONGS_TABLE} SET spotify_id = ? WHERE UPPER(artist) = UPPER(?) AND UPPER(title) = UPPER(?) AND UPPER(album) = UPPER(?)`,
      [song.spotify_id, song.artist, song.title, song.album]
    );
  }
};
/**
 * @function
 * lists all songs from the DB
 */
async function* getAllSongs() {
  let songs = await db.all(
    `SELECT artist,album,title,id,path FROM ${SONGS_TABLE}`
  );
  for (const song of songs) {
    song.cover = await getAlbumCover(song.album, song.artist);
    yield song;
  }
}
const generateQueue = async (album) => {
  const songs = await db.all(`SELECT id FROM ${SONGS_TABLE}`);
  return songs.map((song) => song.id);
};

const getSongInfo = async (id) => {
  const info = await db.get(
    `SELECT path,artist,title,album,spotify_id FROM ${SONGS_TABLE} WHERE id=?`,
    id
  );
  info.cover = await getAlbumCover(info.album, info.artist);
  return info;
};
module.exports = {
  writeToDB,
  getAllSongs,
  loadDB,
  generateQueue,
  getSongInfo,
  updateSpotifyId,
};
