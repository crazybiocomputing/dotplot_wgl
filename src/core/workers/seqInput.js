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
var code = {
    "AAA": normProt.K,
    "AAC": normProt.N,
    "AAU": normProt.N,
    "AAG": normProt.K,
    "ACA": normProt.T,
    "ACC": normProt.T,
    "ACU": normProt.T,
    "ACG": normProt.T,
    "AUA": normProt.I,
    "AUC": normProt.I,
    "AUU": normProt.I,
    "AUG": normProt.M,
    "AGA": normProt.R,
    "AGC": normProt.S,
    "AGU": normProt.S,
    "AGG": normProt.R,
    //
    "CAA": normProt.Q,
    "CAC": normProt.H,
    "CAU": normProt.H,
    "CAG": normProt.Q,
    "CCA": normProt.P,
    "CCC": normProt.P,
    "CCU": normProt.P,
    "CCG": normProt.P,
    "CUA": normProt.L,
    "CUC": normProt.L,
    "CUU": normProt.L,
    "CUG": normProt.L,
    "CGA": normProt.R,
    "CGC": normProt.R,
    "CGU": normProt.R,
    "CGG": normProt.R,
    //
    "UAA": normProt["*"],
    "UAC": normProt.Y,
    "UAU": normProt.Y,
    "UAG": normProt.O,
    "UCA": normProt.S,
    "UCC": normProt.S,
    "UCU": normProt.S,
    "UCG": normProt.S,
    "UUA": normProt.L,
    "UUC": normProt.F,
    "UUU": normProt.F,
    "UUG": normProt.L,
    "UGA": normProt.U,
    "UGC": normProt.C,
    "UGU": normProt.C,
    "UGG": normProt.W,
    //
    "GAA": normProt.E,
    "GAC": normProt.D,
    "GAU": normProt.D,
    "GAG": normProt.E,
    "GCA": normProt.A,
    "GCC": normProt.A,
    "GCU": normProt.A,
    "GCG": normProt.A,
    "GUA": normProt.V,
    "GUC": normProt.V,
    "GUU": normProt.V,
    "GUG": normProt.V,
    "GGA": normProt.G,
    "GGC": normProt.G,
    "GGU": normProt.G,
    "GGG": normProt.G,
    //
    "GCX": normProt.A,
    "RAY": normProt.B,
    "UGY": normProt.C,
    "GAY": normProt.D,
    "GAR": normProt.E,
    "UUY": normProt.F,
    "GGX": normProt.G,
    "CAY": normProt.H,
    "AUH": normProt.I,
    "AAR": normProt.K,
    "UUR": normProt.L,
    "CUX": normProt.L,
    "YUR": normProt.L,
    "AAY": normProt.N,
    "CCX": normProt.P,
    "CAR": normProt.U,
    "CGX": normProt.R,
    "AGR": normProt.R,
    "MGR": normProt.R,
    "UCX": normProt.S,
    "AGY": normProt.S,
    "ACX": normProt.T,
    "GUX": normProt.V,
    "UAY": normProt.y,
    "SAR": normProt.Z,
    "UAR": normProt["*"],
    "URA": normProt["*"],
};
var geneticCode = function(codon) {
    try {
        return code[codon.replace(/T/g, "U")];
    } catch (err) {
        return normProt.X;
    }
};

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
    var comment  = wholeSequence.match(/(^[>;][\s\S]*?)\n(?![>;])/);
    comment = (comment) ? comment[0] : "";
    var sequence = wholeSequence.match(/(^[^>;][\s\S]*)/m)[0].replace(/\s/g, "");
    if (type === "unknown") {
        type = /[EFILOPQZ\*]/i.test(sequence) ? "proteic" : "unknown";
    }
    //Possible to add new tests (stats, comment-based, etc)
    if (type === "unknown") {
        self.postMessage({status: "error", message: "could not determine type"});
        self.close();
    }
    if (typeof this.names[i] === "undefined") {
        try {
            this.names[i] = comment.match(/^./g)[0];
        }
        catch (err) {
            this.names[i] = "sequence " + (i + 1);
        }
    }
    if (type === "nucleic") {
        var sequenceDNA = sequence.toUpperCase().replace(/[^ATGCSWRYKMBVHDNU]/g, "N");
        var sequenceTR = new Uint8Array(sequenceDNA.length);
        for (var j = 0; j < sequenceDNA.length - 2; j++) {
            sequenceTR[j] = geneticCode(sequenceDNA.charAt(j) + sequenceDNA.charAt(j + 1) + sequenceDNA.charAt(j + 2));
        }
        self.postMessage({
            typedArray: stringToTypedArray(sequenceDNA, normDNA),
            translated: sequenceTR,
            name: this.names[i],
            type: type,
            comment: comment,
            status: "sequence"
        });
    } else {
        self.postMessage({
            typedArray: stringToTypedArray(sequence.toUpperCase().replace(/[^ARNDCQEGHILKMFPSTWYVBZX\*]/g, "X"), normProt),
            name: this.names[i],
            type: type,
            comment: comment,
            status: "sequence"
        });
    }
};

var stringToTypedArray = function(sequence, dict) {
    var typedArray = new Uint8Array(sequence.length);
    for (var i = 0; i < sequence.length; i++) {
        typedArray[i] = dict[sequence.charAt(i)];
    }
    return typedArray;
};

var sequenceSeparator = function(string, names, type) {
    string.match(/([>;][^\n]*\n)*[^>;]*/g).filter(function(s) {return s}).forEach(sequenceParser, {names: names, type: type});
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
