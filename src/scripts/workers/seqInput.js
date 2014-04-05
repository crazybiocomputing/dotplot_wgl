/* jshint worker: true */
/* global FileReaderSync: false */

"use strict";

var norm = function(e, i, arr) {
    this[e] = Math.ceil(i * 255 /(arr.length + 1));
};
var normProt = {};
var normDNA = {};
["A", "R", "N", "D", "C", "Q", "E", "G", "H", "I", "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V", "B", "Z", "X"].forEach(norm, normProt);
["A", "C", "G", "T", "X"].forEach(norm, normDNA);
normDNA.U = normDNA.T;
console.log(normProt);
console.log(normDNA);

var sequenceParser = function(string, names, type) {
    //treatment
    self.postMessage({typedArray: string, name: names, type: type});//for each sequence found, to be changed
    //when finished
    self.close();
};

var fileToString = function(file, names, type) {
    if (type === "unknown") {
        if (file.name.match(/\.(fna|ffn|frn)$/i)) {
            type = "nucleic";
        } else if (file.name.match(/\.faa$/i)) {
            type = "proteic";
        }
    }
    names.push(file.name.replace(/\.[^\.]*$/, ""));
    var reader = new FileReaderSync();
    sequenceParser(reader.readAsText(file), names, type);
};

self.addEventListener("message", function(message) {
    //gets and cleans up names passed by user
    var names = message.data.proposedNames.split(/\s*,\s*/).filter(function(name) {
        return !(/^\s*$/.test(name));
    });
    if (typeof message.data.rawInput !== "string") {
        fileToString(message.data.rawInput, names, message.data.type);
    } else {
        sequenceParser(message.data.rawInput, names, message.data.type);
    }
}, false);
