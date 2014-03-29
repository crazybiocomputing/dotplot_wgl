/* jshint worker: true */

"use strict";

var sequenceParser = function(string, names, file) {
    //treatment
    //self.postMessage(sequence); for each sequence found
    //when finished
    self.close();
};

var fileToString = function(file, names, callback) {
    //read file as text
    //callback(result, names);
};

self.addEventListener("message", function(message) {
    var names = message.proposedNames.split(/\s*,\s*/).filter(function(name) {
        return !(/^\s*$/.test(name));
    });
    if (typeof message.rawInput !== "string") {
        fileToString(message.rawInput, names);
    } else {
        sequenceParser(message.rawInput, names);
    }
}, false);
