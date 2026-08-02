// Fading Gods — engine loader for Node.
//
// The browser loads these same files as <script> tags in this order; this is
// the Node equivalent. One engine, imported by both the game and the harness —
// the one principle in architecture/architecture.md that is not preference.
const path = require("path");

["constants", "hex", "map", "state", "rules", "actions", "tick", "ai"]
 .forEach(f => require(path.join(__dirname, f + ".js")));

module.exports = globalThis.FG;
