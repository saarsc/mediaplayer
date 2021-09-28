// const upnp = require("../scripts/upnp");

// QUnit.module("upnp");

// QUnit.log((details) => {
//   if (details.result) {
//     console.log(`[PASS] ${JSON.stringify(details.actual)}`);
//     return;
//   }

//   let output = `[FAILED] ${details.module} > ${details.name}`;

//   if (details.message) {
//     output += `: ${details.message}`;
//   }
//   if (details.actual) {
//     output += `\nexpected: ${details.expected}\nactual: ${details.actual}`;
//   }
//   if (details.source) {
//     output += `\n${details.source}`;
//   }

//   console.log(output);
// });

// QUnit.test("list ips", (assert) => {
//   assert.notEqual(upnp.getNetworks(), null);
// });
