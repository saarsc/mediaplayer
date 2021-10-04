const dbManager = require("./db_manager");
const storage = require("electron-json-storage");
const spotify = require("../spotify");
/**
 * @class
 *
 * @param {boolean} shuffle
 *
 * @property {boolean} shuffle
 * @property {Array} queue
 * @property {number} loc
 *
 */
const Queue = class {
  constructor(shuffle = false) {
    this.shuffle = shuffle;
    this.queue;
    this.loc = 0;
    this.generateQueue();
  }
  #shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }
  async generateQueue(id) {
    const savedData = storage.getSync("queue");

    if (!savedData["queue"]) {
      this.queue = await dbManager.generateQueue();
      if (this.shuffle) {
        const selectedSong = this.queue.splice(this.queue.indexOf(id), 1)[0];
        this.#shuffleQueue();
        this.queue.unshift(selectedSong);
      }
      this.jumpToSong(id);
      storage.set("queue", { queue: this.queue, loc: this.loc });
    } else {
      this.queue = savedData["queue"];
      this.loc = savedData["loc"];
    }
  }
  async updateShuffle(state, id) {
    this.shuffle = state;
    storage.set("queue", { queue: "", loc: "" }, () => {
      this.generateQueue(id);
    });
  }

  async jumpToSong(id) {
    if (id) {
      this.loc = this.queue.indexOf(id);
    } else {
      this.loc = 0;
    }
    this.play(await dbManager.getSongInfo(id));
  }
  async next() {
    const songInfo = await dbManager.getSongInfo(
      this.queue[Math.min(++this.loc, this.queue.length - 1)]
    );
    this.play(songInfo);
    return songInfo;
  }
  async prev() {
    const songInfo = await dbManager.getSongInfo(
      this.queue[Math.max(--this.loc, 0)]
    );
    return;
  }
  async play(song) {
    if (song.spotify_id === "") {
      song.spotify_id = await spotify.getTrackId(song);
      dbManager.updateSpotifyId(song);
    }
    spotify.play(song.id === song.spotify_id, song.spotify_id);
  }
};

module.exports = Queue;
