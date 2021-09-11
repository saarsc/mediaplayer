const sharp = require("sharp");

const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
sqlite3.verbose();
const SONGS_TABLE = "songs";
const ALBUMS_TABLE = "albums";

const getAlbumCover = async (db, name, artist, cover) => {
  let album_cover = await db.get(
    `SELECT cover from ${ALBUMS_TABLE} where artist = ? AND name = ?`,
    [artist, name]
  ).cover;
  if (!album_cover) {
    album_cover = await Buffer.from(
      await sharp(cover).resize(40).toBuffer()
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
  }
  return album_cover;
};

async function* writeToDB(song) {
  // open the database
  const db = await sqlite.open({
    filename: "data.db",
    driver: sqlite3.cached.Database,
  });

  await db.run(
    `CREATE TABLE IF NOT EXISTS ${SONGS_TABLE} ('primkey' INTEGER PRIMARY KEY, 'title' TEXT, 'artist' TEXT, 'album' TEXT, 'id' TEXT, 'date' DATE, 'path' TEXT, 'spotify_id' TEXT)`
  );
  await db.run(
    `CREATE TABLE IF NOT EXISTS ${ALBUMS_TABLE} ('primkey' INTEGER PRIMARY KEY, 'name' TEXT, 'artist' TEXT, 'cover' TEXT)`
  );
  if (
    !(await db.get(`SELECT path from ${SONGS_TABLE} WHERE path = ?`, song.path))
  ) {
    await db.run(
      `INSERT INTO ${SONGS_TABLE} (title,artist,album,id,date,path,spotify_id) VALUES (?,?,?,?,?,?,?)`,
      [
        song.title,
        song.artist,
        song.album,
        song.id,
        song.date,
        song.path,
        song.spotify_id,
      ]
    );
    song.cover = await getAlbumCover(db, song.album, song.artist, song.cover);
    yield song;
  }
}

module.exports = {
  writeToDB,
};
