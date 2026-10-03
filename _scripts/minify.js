/**
 * Minifies javascript using UglifyJS
 * The files are the same (and in the same order) as assets/js/bundle.js
 */
const fs = require('fs');
const path = require('path');
const UglifyJS = require("uglify-js");

const jsdir = '../_includes/javascript/';
const files = ['utilities.js', 'fullscreen.js', 'clock.js', 'desktop.js', 'windows.js', 'typing.js', 'playlist.js', 'screenshot.js'];
const sources = {};
files.forEach(file => sources[file] = fs.readFileSync(path.resolve(__dirname, jsdir, file), "utf8"));
const result = UglifyJS.minify(sources, { toplevel: true });
if (result.error) {
    throw result.error;
}
fs.writeFileSync(path.resolve(__dirname, '../assets/js/bundle.min.js'), result.code, "utf8");
