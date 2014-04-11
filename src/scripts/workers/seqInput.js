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
//console.log(normProt);
//console.log(normDNA);

var xhr2 = function(url, names, type, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "text";
    req.addEventListener("load", function() {
        if (this.status === 200) {
            callback(this.response, names, type);
        }
    }, false);
    req.send();
};

var sequenceParser = function(string, names, type) {
    //treatment
    self.postMessage({typedArray: string, name: names, type: type});//for each sequence found, to be changed
    //when finished
    self.close();
};

var sequenceLoader = function(id, website, names, type) {
    switch (website) {
        case "NCBI":
            xhr2(
                "//www.ncbi.nlm.nih.gov/sviewer/viewer.cgi?sendto=on&dopt=fasta&val=" + id,
                names, type, sequenceParser
            );
            break;
        case "UniProt":
            //FIXME Fails with Firefox, but not with Chrome
            xhr2(
                "//www.uniprot.org/uniprot/" + id.toUpperCase() + ".fasta",
                names, (type === "unknown") ? "protein" : type, sequenceParser
            );
            break;
    }
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
    if (typeof message.data.rawInput !== "string") {//A File was passed
        fileToString(message.data.rawInput, names, message.data.type);
    } else {
        if (message.data.rawInput.match(/^\d*$/)) {//NCBI gi number
            sequenceLoader(message.data.rawInput, "NCBI", names, message.data.type);
        } else if (message.data.rawInput.match(/^([A-NR-Z][\d][A-Z]|[OPQ][\d][A-Z\d])[A-Z\d]{2}[\d]$/i)) {//UniProt accession number
            sequenceLoader(message.data.rawInput, "UniProt", names, message.data.type);
        } else {//Sequence text
            sequenceParser(message.data.rawInput, names, message.data.type);
        }
    }
}, false);
