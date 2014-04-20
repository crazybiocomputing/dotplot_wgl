/*
 *  dotplot_wgl: Dot-Plot implementation in JavaScript and WebGL..
 *  Copyright (C) 2014  Jean-Christophe Taveau.
 *
 *  This file is part of dotplot_wgl.
 *
 *  dotplot_wgl is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  dotplot_wgl is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with dotplot_wgl.  If not, see <http://www.gnu.org/licenses/>
 *
 * Authors:
 * Rania Assab
 * Aurélien Luciani
 * Quentin Riché-Piotaix
 * Mathieu Schaeffer
 */

/*jshint worker: true*/
/*global FileReaderSync: false*/
/*jshint globalstrict: true*/
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
    req.responseType = "blob";
    req.addEventListener("load", function() {
        if (this.status === 200) {
            if (/^\nNothing has been found\n$/g.test(this.response)) {//genbank response when not found
                self.postMessage({status: "error"});
                self.close();
            } else {
                callback(new Blob([this.response]), names, type);
            }
        } else if (/^4/.test(this.status)) {//e.g. 404 not found
            self.postMessage({status: "error", message: "could not load file"});
            self.close();
        }
    }, false);
    req.send();
};

var sequenceParser = function(wholeSequence, i) {
    var type     = this.type;
    var comment  = wholeSequence.match(/^[>;][\s\S]*?\n(?![>;])/);
    comment = (comment) ? comment[0] : "";
    var sequence = wholeSequence.match(/^[^>;][\s\S]*/m)[0].replace(/\s/g, "");
    if (type === "unknown") {
        type = /[EFILOPQZ\*]/i.test(sequence) ? "proteic" : "unknown";
    }
    //Possible to add new tests (stats, comment-based, etc)
    if (type === "unknown") {
        self.postMessage({status: "error", message: "could not determine type"});
        self.close();
    }
    //determine name with "names" array, otherwise, comment-based
    self.postMessage({
        typedArray:
            (type === "proteic") ?
            stringToTypedArray(sequence.toUpperCase().replace(/[^ARNDCQEGHILKMFPSTWYVBZX\*]/g, "X"), normProt) :
            stringToTypedArray(sequence.toUpperCase().replace(/[^ATGCSWRYKMBVHDNU]/g, "N"), normDNA),
        name: this.names[i],
        type: type,
        comment: comment,
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
    string.match(/([>;][^\n]*\n)*[^>;]*/g).forEach(sequenceParser, {names: names, type: type});
    self.postMessage({status: "done"});
    self.close();
};

var sequenceLoader = function(id, website, names, type) {
    switch (website) {
        case "NCBI":
            xhr2(
                "//eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=fasta&retmode=text&id=" + id,
                names, type, fileToString
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
    var reader = new FileReaderSync();
    sequenceSeparator(reader.readAsText(file), names, type);
};

self.addEventListener("message", function(message) {
    //gets and cleans up names passed by user
    var names = message.data.proposedNames.split(/\s*,\s*/).filter(function(name) {
        return Boolean(name);
    });
    if (typeof message.data.rawInput !== "string") {//A File was passed
        var type = message.data.type;
        if (type === "unknown") {
            if (message.data.rawInput.name.match(/\.(fna|ffn|frn)$/i)) {
                type = "nucleic";
            } else if (message.data.rawInput.name.match(/\.faa$/i)) {
                type = "proteic";
            }
        }
        names.push(message.data.rawInput.name.replace(/\.[^\.]*$/, ""));
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
