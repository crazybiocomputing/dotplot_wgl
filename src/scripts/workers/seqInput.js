/* jshint worker: true */

"use strict";

var sequenceParser = function(string, names, file) {
    //treatment
    //self.postMessage(sequence); for each sequence found
    //when finished
    self.close();
};

var fileToString = function(file, names, callback) {
    names.push(file.name.replace(/\.[^\.]*$/, ""));
    //read file as text
    //callback(result, names);
};

self.addEventListener("message", function(message) {
    //gets and cleans up names passed by user
    var names = message.data.proposedNames.split(/\s*,\s*/).filter(function(name) {
        return !(/^\s*$/.test(name));
    });
    if (typeof message.data.rawInput !== "string") {
        fileToString(message.data.rawInput, names);
    } else {
        sequenceParser(message.data.rawInput, names);
    }
}, false);
