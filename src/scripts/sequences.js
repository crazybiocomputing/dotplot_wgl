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

"use strict";

//params: name, protein, (key | typedArray)
var Sequence = function(params) {
    if (!params.key) {
        //store params.typedArray to IndexedDB
        //get resulting id
        this.key = 1;
    } else {
        this.key = params.key;
    }
    this.name = params.name;
    this.protein = params.protein;
};

var SequenceManager = function() {
    this.sequences = [];
    var addClean = function(cleaned, key) {
        if (key) {
            this.sequences.push(new Sequence(cleaned));
            this.updateDOM();
        } else {
            //store to indexeddb
            //get key
            //store to indexeddb
            //add to this.sequences
        }
    };
    this.add = function(rawInput, proposedNames) {
        var w = new Worker("scripts/workers/seqInput.js");
        w.addEventListener("message", function(message) {
            console.log("Adding a sequences");
            addClean(message, false);
        }, false);
        w.postMessage({
            rawInput: rawInput,
            proposedNames: proposedNames
        });
    };
    this.updateDOM = function() {
        var options = document.createDocumentFragment();
        this.sequences.forEach(function(sequence) {
            var option = document.createElement("option");
            option.value = sequence.key;
            option.textContent = sequence.name;
            option.dataset.type = (sequence.protein ? "protein" : "dna");
            options.appendChild(option);
        });
        [$("seq1"), $("seq2")].forEach(function(seqSelect) {
            while(seqSelect.firstChild) {
                seqSelect.removeChild(seqSelect.firstChild);
            }
            seqSelect.appendChild(options.cloneNode(true));
        });
    };
};

var seqMan = new SequenceManager();
var cursorGetter = db.transaction(["sequencesMetadata"], "readonly").objectStore("sequencesMetadata").openCursor();
cursorGetter.addEventListener("success", function(e) {
    var cursor = e.target.result;
    if (cursor) {
        seqMan.sequences.push(cursor.value);
        cursor.continue();
    } else {
        seqMan.updateDOM();
        loadScripts(["scripts/viewer.js"]);
    }
}, false);
