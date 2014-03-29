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

g.seqMan.sequences = [];

g.seqMan.addClean = function(cleaned) {
    var trans = g.db.transaction(["sequences", "sequencesMetadata"], "readwrite");
    var seqOS = trans.objectStore("sequences");
    var request1 = seqOS.add(cleaned.typedArray);
    request1.onsuccess = function(e) {
        var seqMetaOS = trans.objectStore("sequencesMetadata");
        var seqTemp = {
            name: cleaned.name,
            protein: cleaned.protein,
            size: cleaned.size,
            key: e.target.result
        };
        var request2 = seqMetaOS.add(seqTemp);
        request2.onsuccess(function(){
            g.seqMan.sequences.push(seqTemp);
            g.seqMan.updateDOM();
            console.log("added a sequence");
        });
    };
};

g.seqMan.add = function(rawInput, proposedNames) {
    var w = new Worker("scripts/workers/seqInput.js");
    w.addEventListener("message", function(message) {
        console.log("Adding a sequences");
        g.seqMan.addClean(message, false);
    }, false);
    w.postMessage({
        rawInput: rawInput,
        proposedNames: proposedNames
    });
};

g.seqMan.updateDOM = function() {
    var options = document.createDocumentFragment();
    var list = document.createDocumentFragment();
    if (g.seqMan.sequences.length) {
        g.seqMan.sequences.forEach(function(sequence) {
            var option = document.createElement("option");
            option.value = sequence.key;
            option.textContent = sequence.name;
            option.dataset.type = (sequence.protein ? "protein" : "dna");
            options.appendChild(option);
            var close = document.createElement("div");
            close.textContent = "remove";
            close.dataset.key = sequence.key;
            var item = document.createElement("li");
            item.textContent = sequence.name + ", size: " + sequence.size;
            item.dataset.type = (sequence.protein ? "protein" : "dna");
            item.appendChild(close);
            list.appendChild(item);
        });
    } else {
        var option = document.createElement("option");
        option.textContent = "No sequence";
        option.disabled = true;
        options.appendChild(option);
    }
    [g.$("seq1"), g.$("seq2")].forEach(function(seqSelect) {
        while (seqSelect.firstChild) {
            seqSelect.removeChild(seqSelect.firstChild);
        }
        seqSelect.appendChild(options.cloneNode(true));
    });
    var listDOM = g.$("sequence-list");
    while (listDOM.firstChild) {
        listDOM.removeChild(listDOM.firstChild);
    }
    listDOM.appendChild(list);
};

g.seqMan.remove = function(key) {
    var removed;
    for (var i = 0; i < g.seqMan.sequences.length; i++) {
        if (g.seqMan.sequences[i].key === key) {
            removed = g.seqMan.sequences.splice(i, 1)[0];
            break;
        }
    }
    if (removed) {
        var trans = g.db.transaction(["sequences", "sequencesMetadata"], "readwrite");
        trans.addEventListener("complete", function() {
            console.log("removed " + removed.name);
        }, false);
        trans.objectStore("sequences").delete(key);
        trans.objectStore("sequencesMetadata").delete(key);
        g.seqMan.updateDOM();
    }
};

var cursorGetter = g.db.transaction(["sequencesMetadata"], "readonly").objectStore("sequencesMetadata").openCursor();
cursorGetter.addEventListener("success", function(e) {
    var cursor = e.target.result;
    if (cursor) {
        g.seqMan.sequences.push(cursor.value);
        cursor.continue();
    } else {
        if (g.DOMLoaded) {
            g.seqMan.updateDOM();
        }
        g.loadScripts(["scripts/viewer.js"]);
    }
}, false);
