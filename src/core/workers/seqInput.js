/* jshint worker: true */
/* global FileReaderSync: false */

"use strict";

var norm = function(e, i, arr) {
    this[e] = Math.ceil(i * 255 /(arr.length + 1));
};
var normProt = {};
var normDNA = {};
["A", "R", "N", "D", "C", "Q", "E", "G", "H", "I", "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V", "B", "Z", "X", "*"].forEach(norm, normProt);
["A", "T", "G", "C", "S", "W", "R", "Y", "K", "M", "B", "V", "H", "D", "N", "U"].forEach(norm, normDNA);
normDNA.U = normDNA.T;

var xhr2 = function(url, names, type, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "text";
    req.addEventListener("load", function() {
        if (this.status === 200) {
            if (/^\nNothing has been found\n$/g.test(this.response)) {//genbank response when not found
                self.postMessage({status: "error"});
                self.close();
            } else {
                callback(this.response, names, type);
            }
        } else if (/^4/.test(this.status)) {//e.g. 404 not found
            self.postMessage({status: "error", message: "could not load file"});
            self.close();
        }
    }, false);
    req.send();
};

var sequenceParser = function(wholeSequence, i) {
    var type = this.type;
    var parts = wholeSequence.split(/\n(?![>;])/m);
    parts[1] = parts[1].replace(/\s/g, "");
    if (type === "unknown") {
        type = /[EFILOPQZ\*]/i.test(parts[1]) ? "proteic" : "unknown";
    }
    //Possible to add new tests (stats, comment-based, etc)
    if (type === "unknown") {
        self.postMessage({status: "error", message: "could not determine type"});
        self.close();
    }
    //determine name with "names" array, otherwise, comment-based
    console.log(this.names[i]);
    self.postMessage({
        typedArray:
            (type === "proteic") ?
            stringToTypedArray(parts[1].toUpperCase().replace(/[^ARNDCQEGHILKMFPSTWYVBZX\*]/g, "X"), normProt) :
            stringToTypedArray(parts[1].toUpperCase().replace(/[^ATGCSWRYKMBVHDNU]/g, "N"), normDNA),
        name: this.names[i],
        type: type,
        comment: parts[0],
        status: "sequence"
    });
};

var stringToTypedArray = function(sequence, dict) {
    var typedArray = new Uint8Array(sequence.length);
    for (var i = 0; i < sequence.length; i++) {
        typedArray[i] = dict[sequence.charAt(i)];
    }
    return typedArray;
};

var sequenceSeparator = function(string, names, type) {
    string.match(/^[>;][\s\S]*?^[^>;]*$/m).forEach(sequenceParser, {names: names, type: type});
    self.postMessage({status: "done"});
    self.close();
};

var sequenceLoader = function(id, website, names, type) {
    switch (website) {
        case "NCBI":
            xhr2(
                "//www.ncbi.nlm.nih.gov/sviewer/viewer.cgi?dopt=fasta&retmode=text&val=" + id,
                names, type, sequenceSeparator
            );
            break;
        case "UniProt":
            //FIXME Fails with Firefox, but not with Chrome
            xhr2(
                "//www.uniprot.org/uniprot/" + id.toUpperCase() + ".fasta",
                names, "proteic", sequenceSeparator
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
    sequenceSeparator(reader.readAsText(file), names, type);
};

self.addEventListener("message", function(message) {
    //gets and cleans up names passed by user
    var names = message.data.proposedNames.split(/\s*,\s*/).filter(function(name) {
        return Boolean(name);
    });
    if (typeof message.data.rawInput !== "string") {//A File was passed
        fileToString(message.data.rawInput, names, message.data.type);
    } else {
        if (message.data.rawInput.match(/^\d*$/)) {//NCBI gi number
            sequenceLoader(message.data.rawInput, "NCBI", names, message.data.type);
        } else if (message.data.rawInput.match(/^([A-NR-Z][\d][A-Z]|[OPQ][\d][A-Z\d])[A-Z\d]{2}[\d]$/i)) {//UniProt accession number
            sequenceLoader(message.data.rawInput, "UniProt", names, message.data.type);
        } else {//Sequence text
            sequenceSeparator(message.data.rawInput, names, message.data.type);
        }
    }
}, false);
