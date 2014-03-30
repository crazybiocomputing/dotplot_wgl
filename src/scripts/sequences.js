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
    request1.addEventListener("success", function(e) {
        var seqMetaOS = trans.objectStore("sequencesMetadata");
        var seqTemp = {
            name: cleaned.name,
            protein: cleaned.protein,
            size: cleaned.typedArray.length,
            key: e.target.result
        };
        var request2 = seqMetaOS.add(seqTemp);
        request2.addEventListener("success", function() {
            g.seqMan.sequences.push(seqTemp);
            g.seqMan.addDOM([seqTemp]);
            console.log("added a sequence");
        });
    }, false);
};

g.seqMan.add = function(rawInput, proposedNames) {
    var w = new Worker("scripts/workers/seqInput.js");
    w.addEventListener("message", function(message) {
        console.log("Adding a sequence");
        g.seqMan.addClean(message.data);
    }, false);
    w.postMessage({
        rawInput: rawInput,
        proposedNames: proposedNames
    });
};

g.seqMan.addDOM = function(sequences) {
    sequences.forEach(function(sequence) {
        sequence.opt1 = g.DOM.optTempl.cloneNode(true);
        sequence.opt1.value = sequence.key;
        sequence.opt1.textContent = sequence.name;
        sequence.opt1.dataset.type = (sequence.protein ? "protein" : "dna");
        sequence.opt2 = sequence.opt1.cloneNode(true);
        g.DOM.opt1.appendChild(sequence.opt1);
        g.DOM.opt2.appendChild(sequence.opt2);
        sequence.li = g.DOM.liTempl.cloneNode(true);
        sequence.li.children[1].dataset.key = sequence.key;
        sequence.li.children[0].textContent = sequence.name + " (" + sequence.size + (sequence.protein ? " aa)" : " bp)");
        sequence.li.dataset.type = (sequence.protein ? "protein" : "dna");
        g.DOM.li.appendChild(sequence.li);
    });
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
        g.DOM.li.removeChild(removed.li);
        g.DOM.opt1.removeChild(removed.opt1);
        g.DOM.opt2.removeChild(removed.opt2);
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
            g.seqMan.addDOM(g.seqMan.sequences);
        }
        g.loadScripts(["scripts/viewer.js"]);
    }
}, false);
