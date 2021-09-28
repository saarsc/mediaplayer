const dbManager = require("./db_manager");
const storage = require("electron-json-storage");
/**
 * @class
 *
 * @param {boolean} suffle
 *
 * @property {boolean} suffle
 * @property {Array} queue
 * @property {number} loc
 *
 */
const Queue = class {
  constructor(suffle = false) {
    this.suffle = suffle;
    this.queue;
    this.loc = 0;
    this.generateQueue();
  }
  #suffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }
  async generateQueue(id) {
    const savedData = storage.getSync("queue");
    if (!savedData["queue"]) {
      this.queue = await dbManager.generateQueue();
      if (this.suffle) {
        const selectedSong = this.queue.splice(this.queue.indexOf(id), 1);
        this.#suffleQueue();
        this.queue.unshift(selectedSong);
      }
      this.jumpToSong(id);
      storage.set("queue", { queue: this.queue, loc: this.loc });
    } else {
      this.queue = savedData["queue"];
      this.loc = savedData["loc"];
    }
  }
  set shuffle(state) {
    this.shuffle = state;
  }

  jumpToSong(id) {
    if (id) {
      this.loc = this.queue.indexOf(id);
    } else {
      this.loc = 0;
    }
  }
  next() {
    return this.queue[Math.min(++this.loc, this.queue.length - 1)];
  }
  prev() {
    return this.queue[Math.max(--this.loc, 0)];
  }
};

module.exports = Queue;
