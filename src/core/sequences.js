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

g.seqMgr.list = [];

g.seqMgr.addClean = function(cleaned) {
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
            g.seqMgr.list.push(seqTemp);
            g.seqMgr.addDOM([seqTemp]);
            console.log("added a sequence");
        });
    }, false);
};

g.seqMgr.add = function(rawInput, proposedNames, type) {
    var w = new Worker("core/workers/seqInput.js");
    var count = 0;
    w.addEventListener("message", function(message) {
        switch (message.data.status) {
            case "error":
                if (Notification && Notification.permission === "granted") {
                    new Notification("Error", {body: "Could not load a sequence"});
                }
                break;
            case "sequence":
                count++;
                console.log(message.data);
                //g.seqMgr.addClean(message.data);
                break;
            case "done":
                if (Notification && Notification.permission === "granted") {
                    new Notification(count + " sequence" + ((count > 1) ? "s" : "") + " imported", {body: "type: " + message.data.type});
                }
                break;
        }
    }, false);
    w.postMessage({
        rawInput: rawInput,
        proposedNames: proposedNames,
        type: type
    });
};

g.seqMgr.addDOM = function(sequences) {
    sequences.forEach(function(sequence) {
        sequence.opt1 = document.createElement("option");
        sequence.opt1.value = sequence.key;
        sequence.opt1.textContent = sequence.name;
        sequence.opt1.dataset.type = (sequence.protein ? "proteic" : "nucleic");
        sequence.opt2 = sequence.opt1.cloneNode(true);
        g.DOM.opt1.appendChild(sequence.opt1);
        g.DOM.opt2.appendChild(sequence.opt2);
        sequence.li = g.DOM.liTempl.cloneNode(true);
        sequence.li.children[1].dataset.key = sequence.key;
        sequence.li.children[0].textContent = sequence.name + " (" + sequence.size + (sequence.protein ? " aa)" : " bp)");
        sequence.li.dataset.type = (sequence.protein ? "proteic" : "nucleic");
        g.DOM.li.appendChild(sequence.li);
    });
};

g.seqMgr.remove = function(key) {
    var removed;
    for (var i = 0; i < g.seqMgr.list.length; i++) {
        if (g.seqMgr.list[i].key === key) {
            removed = g.seqMgr.list.splice(i, 1)[0];
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

(function() {
    var cursorGetter = g.db.transaction(["sequencesMetadata"], "readonly").objectStore("sequencesMetadata").openCursor();
    cursorGetter.addEventListener("success", function(e) {
        var cursor = e.target.result;
        if (cursor) {
            g.seqMgr.list.push(cursor.value);
            cursor.continue();
        } else {
            if (g.DOMLoaded) {
                g.seqMgr.addDOM(g.seqMgr.list);
                g.matMgr.updateDOM();
            } else {
                document.addEventListener("DOMContentLoaded", function() {
                    g.seqMgr.addDOM(g.seqMgr.list);
                    g.matMgr.updateDOM();
                }, false);
            }
            g.loadScripts(["core/viewer.js"]);
        }
    }, false);
}());
