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

/**
 * WebWorker - Generates a sequence from a raw input
 * @module SeqInput
 */

/**
 * Generates a lookup table for internal use from an element's position normalizing it's value between 0 and 255
 * @param {string} e - element from an array
 * @param {number} i - this element's index
 * @param {array} arr - this element's array
 */
var norm = function(e, i, arr) {
    this[e] = Math.round(i * 255 / arr.length + (127.5 / arr.length));
};

/**
 * Nucleic lookup table
 * @type {Object.<string, number>}
 */
var normProt = {};
/**
 * Proteic lookup table
 * @type {Object.<string, number>}
 */
var normDNA = {};
["A", "R", "N", "D", "C", "Q", "E", "G", "H", "I", "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V", "B", "Z", "X", "*"].forEach(norm, normProt);
["A", "T", "G", "C", "S", "W", "R", "Y", "K", "M", "B", "V", "H", "D", "N", "U"].forEach(norm, normDNA);

/**
 * Genetic code lookup table
 * @type {Object.<string, string>}
 */
var code = {
    "AAA": "K",
    "AAC": "N",
    "AAU": "N",
    "AAG": "K",
    "ACA": "T",
    "ACC": "T",
    "ACU": "T",
    "ACG": "T",
    "AUA": "I",
    "AUC": "I",
    "AUU": "I",
    "AUG": "M",
    "AGA": "R",
    "AGC": "S",
    "AGU": "S",
    "AGG": "R",
    //
    "CAA": "Q",
    "CAC": "H",
    "CAU": "H",
    "CAG": "Q",
    "CCA": "P",
    "CCC": "P",
    "CCU": "P",
    "CCG": "P",
    "CUA": "L",
    "CUC": "L",
    "CUU": "L",
    "CUG": "L",
    "CGA": "R",
    "CGC": "R",
    "CGU": "R",
    "CGG": "R",
    //
    "UAA": "*",
    "UAC": "Y",
    "UAU": "Y",
    "UAG": "O",
    "UCA": "S",
    "UCC": "S",
    "UCU": "S",
    "UCG": "S",
    "UUA": "L",
    "UUC": "F",
    "UUU": "F",
    "UUG": "L",
    "UGA": "U",
    "UGC": "C",
    "UGU": "C",
    "UGG": "W",
    //
    "GAA": "E",
    "GAC": "D",
    "GAU": "D",
    "GAG": "E",
    "GCA": "A",
    "GCC": "A",
    "GCU": "A",
    "GCG": "A",
    "GUA": "V",
    "GUC": "V",
    "GUU": "V",
    "GUG": "V",
    "GGA": "G",
    "GGC": "G",
    "GGU": "G",
    "GGG": "G",
    //
    "GCN": "A",
    "GCR": "A",
    "GCY": "A",
    "GCK": "A",
    "GCM": "A",
    "GCS": "A",
    "GCW": "A",
    "GCB": "A",
    "GCD": "A",
    "GCH": "A",
    "GCV": "A",
    "RAY": "B",
    "UGY": "C",
    "GAY": "D",
    "GAR": "E",
    "UUY": "F",
    "GGN": "G",
    "GGR": "G",
    "GGY": "G",
    "GGK": "G",
    "GGM": "G",
    "GGS": "G",
    "GGW": "G",
    "GGB": "G",
    "GGD": "G",
    "GGH": "G",
    "GGV": "G",
    "CAY": "H",
    "AUH": "I",
    "AUY": "I",
    "AUM": "I",
    "AUW": "I",
    "AAR": "K",
    "UUR": "L",
    "CUN": "L",
    "CUR": "L",
    "CUY": "L",
    "CUK": "L",
    "CUM": "L",
    "CUS": "L",
    "CUW": "L",
    "CUB": "L",
    "CUD": "L",
    "CUH": "L",
    "CUV": "L",
    "YUR": "L",
    "AAY": "N",
    "CCN": "P",
    "CCR": "P",
    "CCY": "P",
    "CCK": "P",
    "CCM": "P",
    "CCS": "P",
    "CCW": "P",
    "CCB": "P",
    "CCD": "P",
    "CCH": "P",
    "CCV": "P",
    "CAR": "U",
    "CGN": "R",
    "CGR": "R",
    "CGY": "R",
    "CGK": "R",
    "CGM": "R",
    "CGS": "R",
    "CGW": "R",
    "CGB": "R",
    "CGD": "R",
    "CGH": "R",
    "CGV": "R",
    "AGR": "R",
    "MGR": "R",
    "UCN": "S",
    "UCR": "S",
    "UCY": "S",
    "UCK": "S",
    "UCM": "S",
    "UCS": "S",
    "UCW": "S",
    "UCB": "S",
    "UCD": "S",
    "UCH": "S",
    "UCV": "S",
    "AGY": "S",
    "ACN": "T",
    "ACR": "T",
    "ACY": "T",
    "ACK": "T",
    "ACM": "T",
    "ACS": "T",
    "ACW": "T",
    "ACB": "T",
    "ACD": "T",
    "ACH": "T",
    "ACV": "T",
    "GUN": "V",
    "GUR": "V",
    "GUY": "V",
    "GUK": "V",
    "GUM": "V",
    "GUS": "V",
    "GUW": "V",
    "GUB": "V",
    "GUD": "V",
    "GUH": "V",
    "GUV": "V",
    "UAY": "Y",
    "SAR": "Z",
    "UAR": "*",
    "URA": "*",
};
/**
 * Returns the letter corresponding to the biological translation of a codon
 * @param {string} codon - a nucleic codon, a three-letter string
 * @return {string} Corresponding amino acid
 */
var geneticCode = function(codon) {
    if (codon.replace(/T/g, "U") in code) {
        return code[codon.replace(/T/g, "U")];
    } else {
        return "X";
    }
};

/**
 * Complementary lookup table
 * @type {Object.<string, string>}
 */
var comp = {
    "A": "T",
    "T": "A",
    "U": "A",
    "C": "G",
    "G": "C",
    "K": "M",
    "M": "K",
    "R": "Y",
    "Y": "R",
    "S": "S",
    "W": "W",
    "B": "V",
    "V": "B",
    "H": "D",
    "D": "H",
    "N": "N"
};

/**
 * Support for transferable objects in Workers
 * @type {boolean}
 */
var transf;

/**
 * Parses a sequence
 * @param {string} wholeSequence - part of the raw input corresponding to one sequence with its comment
 * @param {number} i - index of this sequence in the raw input
 */
var sequenceParser = function(wholeSequence, i) {
    //comment part of the sequence
    var comment  = wholeSequence.match(/(^[>;][\s\S]*?)\n(?![>;])/);
    //empty string comment in case there was none
    comment = (comment) ? comment[0] : "";
    //sequence part, cleaned of spaces and numbers
    var sequence = wholeSequence.match(/(^[^>;][\s\S]*)/m)[0].replace(/[\s\d]?/g, "");
    if (this.type === "unknown") {
        //we look for an exclusively proteic letter
        this.type = /[EFILOPQZ\*]/i.test(sequence) ? "proteic" : "unknown";
    }
    if (this.type === "unknown") {
        self.postMessage({
            status: "error",
            message: "Could not determine type, try specifying one before loading the sequence"
        });
    } else {
        if (typeof this.names[i] === "undefined") {
            //no name is defined for this sequence
            try {
                //try extracting it from the comment part
                this.names[i] = comment.match(/[^|]*$/)[0].trim().substr(0, 25);
                if (!this.names[i]) {
                    throw "no name found";
                }
            }
            catch(err) {
                //default name
                this.names[i] = (new Date()).toLocaleString() + " " + this.type + " sequence " + (i + 1);
            }
        }
        if (this.type === "nucleic") {
            var seq = sequence.toUpperCase().replace(/[^ATGCSWRYKMBVHDNU]/g, "N"),
                interlacedProt = "";
            for (var j = 0; j < seq.length - 2; j++) {
                interlacedProt += geneticCode(seq.charAt(j) + seq.charAt(j + 1) + seq.charAt(j + 2));
            }
            interlacedProt += "XX";
            var rev = "";
            //Sequence's reverse
            for (j = seq.length; j; j--) {
                rev += seq.charAt(j - 1);
            }
            var revComp = "";
            //Sequence's reverse complementary
            for (j = 0; j < rev.length; j++){
                revComp += comp[rev.charAt(j)];
            }
            var interlacedNuc = "";
            //If the sequence's type is nucleic, obtains its "traduction" with the three open reading frame interlaced
            for (j = 0; j < seq.length; j++) {
                interlacedNuc += seq.charAt(j) + rev.charAt(j) + revComp.charAt(j);
            }
            var sequenceTrS = ["", "", ""];
            //Separates the interlaced sequence in three proteic sequences
            for (j = 0; j < interlacedProt.length; j++) {
                sequenceTrS[j % 3] += interlacedProt.charAt(j);
            }
            if (!transf) {
                self.postMessage({
                    nucleic:  stringToTypedArray(interlacedNuc, normDNA),
                    nucleicS: [seq, rev, revComp],
                    proteic:  stringToTypedArray(interlacedProt, normProt),
                    proteicS: sequenceTrS,
                    name:     this.names[i],
                    type:     this.type,
                    comment:  comment,
                    status:   "sequence",
                    size:     seq.length
                });
            } else {
                var nucleic = stringToTypedArray(interlacedNuc, normDNA),
                    proteic = stringToTypedArray(interlacedProt, normProt);
                self.postMessage({
                    nucleic:  nucleic,
                    nucleicS: [seq, rev, revComp],
                    proteic:  proteic,
                    proteicS: sequenceTrS,
                    name:     this.names[i],
                    type:     this.type,
                    comment:  comment,
                    status:   "sequence",
                    size:     seq.length
                }, [nucleic.buffer, proteic.buffer]);
            }
        } else {
            var seq = sequence.toUpperCase().replace(/[^ARNDCQEGHILKMFPSTWYVBZX\*]/g, "X");
            if (transf) {
                self.postMessage({
                    proteic:  stringToTypedArray(seq, normProt),
                    proteicS: seq,
                    name:     this.names[i],
                    type:     this.type,
                    comment:  comment,
                    status:   "sequence",
                    size:     seq.length
                });
            } else {//support transferable objects
                var proteic = stringToTypedArray(seq, normProt);
                self.postMessage({
                    proteic:  proteic,
                    proteicS: seq,
                    name:     this.names[i],
                    type:     this.type,
                    comment:  comment,
                    status:   "sequence",
                    size:     seq.length
                }, [proteic.buffer]);
            }
        }
    }
};

/**
 * Transforms each character of the string sequence in elements of an array
 * @param {string} sequence - the sequence
 * @param {array} dict - contains each character of the sequence
 */
var stringToTypedArray = function(sequence, dict) {
    var typedArray = new Uint8Array(sequence.length);
    for (var i = 0; i < sequence.length; i++) {
        typedArray[i] = dict[sequence.charAt(i)];
    }
    return typedArray;
};


/**
 * Separates sequences in an array and then parses them
 * @param {string} string - the sequence
 * @param {string} names - name of the sequence
 * @param {string} type - nature of the sequence
 */
var sequenceSeparator = function(string, names, type) {
    string.match(/([>;][^\n]*\n)*[^>;]*/g).filter(function(s) {return s}).forEach(sequenceParser, {names: names, type: type});
    self.postMessage({status: "done"});
    self.close();
};

/**
 * Loads the sequence
 * @param {string} id - the sequence
 * @param {string} website - sequence website's origin 
 * @param {string} names - name of the sequence
 * @param {string} type - nature of the sequence
 */
var sequenceLoader = function(id, website, names, type) {
    /**
     * Loads resource from the Internet
     * @param {string} url - url of the resource
     * @param {string} names - user names for the sequence
     * @param {string} type - user type for the sequence
     * @param {function} callback - function called after the response has been received
     */
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
                names, "proteic", fileToString
            );
            break;
    }
};

/**
 * Separates sequences in an array and then parses them
 * @param {string} file - file containing the sequence to transform in string
 * @param {string} names - name of the sequence
 * @param {string} type - nature of the sequence
 */
var fileToString = function(file, names, type) {
    var reader = new FileReaderSync();
    sequenceSeparator(reader.readAsText(file), names, type);
};

self.addEventListener("message", function(message) {
    transf = message.data.transf;
    //gets and cleans up names passed by user
    var names = message.data.proposedNames.split(/\s*,\s*/).filter(function(e) {return e;});
    if (typeof message.data.rawInput !== "string") {
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
