const { networkInterfaces } = require("os");
const dgram = require("dgram");
const { spawn } = require("child_process");
const { join } = require("path");
const UPnPRemote = require("node-upnp-remote");
const Client = require("node-ssdp").Client;
const parser = require("fast-xml-parser");
const got = require("got");
/**
 * @function
 * @returns {object} of local local ips
 */
const getNetworks = () => {
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        results[net.address] = net.address;
      }
    }
  }

  return Object.keys(results);
};
const ssdp_request = (ssdp_st) => {
  return `
  M-SEARCH * HTTP/1.1
  ST:${ssdp_st}
  MX:2
  MAN: "ssdp:discover"
  HOST: 239.255.255.250:1900
  `;
};
const getPythonScriptStdout = (pythonScriptPath) => {
  const python = spawn(join(__dirname, "../venv/Scripts/python.exe"), [
    pythonScriptPath,
  ]);
  return new Promise((resolve, reject) => {
    let result = "";
    python.stdout.on("data", (data) => {
      result += data;
    });
    python.on("close", () => {
      resolve(result);
    });
    python.on("error", (err) => {
      reject(err);
    });
  });
};
const scan = () => {
  client = new Client({
    explicitSocketBind: true,
  });
  client.on("response", function (headers, statusCode, rinfo) {
    console.log(headers);
  });
  setInterval(function () {
    client.search("ssdp:all");
    client.search("upnp:rootdevice");
  }, 5000);
};

const remote = new UPnPRemote({
  url: "http://192.168.1.32:60006/upnp/desc/aios_device/aios_device.xml",
});
remote.play(1);

remote.setURI({
  protocolInfo: "http-get:*:audio/mp3:*",
  uri: "http://192.168.1.43:8000/Mardy Bum(Glastonbury 2013).mp3",
  title: "Alex Turner",
  creator: "Alex Turner",
});

// test();
module.exports = { getNetworks };
