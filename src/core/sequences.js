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
/*jshint -W079 */

/*exported sequences*/
var sequences = function() {
    var list = [];

    var addDOM = function(sequences) {
        sequences.forEach(function(sequence) {
            sequence.opt1 = document.createElement("option");
            sequence.opt1.value        = sequence.key;
            sequence.opt1.textContent  = sequence.name;
            sequence.opt1.dataset.type = sequence.type;
            sequence.opt1.dataset.size = sequence.size;
            sequence.opt1.dataset.key  = sequence.key;
            sequence.opt2 = sequence.opt1.cloneNode(true);
            g.DOM.opt1.appendChild(sequence.opt1);
            g.DOM.opt2.appendChild(sequence.opt2);
            sequence.li = g.DOM.liTempl.cloneNode(true);
            sequence.li.children[2].dataset.key = sequence.key;
            sequence.li.children[1].textContent = "(" + sequence.size + ((sequence.type === "proteic") ? " aa)" : " bp)");
            sequence.li.children[0].textContent = sequence.name;
            sequence.li.dataset.type = sequence.type;
            g.DOM.li.appendChild(sequence.li);
        });
    };

    g.seqMgr.add = function(rawInput, proposedNames, type) {
        var w = new Worker("core/workers/seqInput.js"),
            count    = 0,
            proteics = 0,
            nucleics = 0;
        w.addEventListener("message", function(message) {
            switch (message.data.status) {
                case "error":
                    if (window.Notification && window.Notification.permission === "granted") {
                        new window.Notification("Error", {body: message.data.message, icon: "images/favicon-128.png"});
                    }
                    break;
                case "sequence":
                    count++;
                    if (message.data.type === "proteic") {
                        proteics++;
                    } else {
                        nucleics++;
                    }
                    addClean(message.data);
                    break;
                case "done":
                    if (window.Notification && window.Notification.permission === "granted") {
                        new window.Notification(count + " sequence" + ((count > 1) ? "s" : "") + " imported", {body: "nucleic: " + nucleics + " ; proteic: " + proteics, tag: parseInt(Date.now() / 2000), icon: "images/favicon-128.png"});
                    }
                    break;
            }
        }, false);
        w.postMessage({
            rawInput:      rawInput,
            proposedNames: proposedNames,
            type:          type,
            transf:        g.transf
        });
    };

    g.seqMgr.remove = function(key) {
        var removed;
        for (var i = 0; i < list.length; i++) {
            if (list[i].key === key) {
                removed = list.splice(i, 1)[0];
                break;
            }
        }
        if (removed) {
            if (g.db) {
                var trans = g.db.transaction(["sequences", "sequencesMetadata"], "readwrite");
                trans.addEventListener("complete", function() {
                    console.log("removed " + removed.name);
                }, false);
                trans.objectStore("sequences").delete(key);
                trans.objectStore("sequencesMetadata").delete(key);
            }
            g.DOM.li.removeChild(removed.li);
            g.DOM.opt1.removeChild(removed.opt1);
            g.DOM.opt2.removeChild(removed.opt2);
        }
    };

    var addClean;
    if (g.db) {
        addClean = function(cleaned) {
            var trans = g.db.transaction(["sequences", "sequencesMetadata"], "readwrite");
            var seqOS = trans.objectStore("sequences");
            var request1;
            if (cleaned.type === "proteic") {
                request1 = seqOS.add({
                    proteic:  cleaned.proteic,
                    proteicS: cleaned.proteicS
                });
            } else {
                request1 = seqOS.add({
                    nucleic:  cleaned.nucleic,
                    nucleicS: cleaned.nucleicS,
                    proteic:  cleaned.proteic,
                    proteicS: cleaned.proteicS
                });
            }
            request1.addEventListener("success", function(e) {
                var seqMetaOS = trans.objectStore("sequencesMetadata");
                var seqTemp = {
                    name:    cleaned.name,
                    type:    cleaned.type,
                    size:    cleaned.size,
                    comment: cleaned.comment,
                    key:     e.target.result
                };
                var request2 = seqMetaOS.add(seqTemp);
                request2.addEventListener("success", function() {
                    list.push(seqTemp);
                    addDOM([seqTemp]);
                });
            }, false);
        };

        g.seqMgr.get = function(key, nucleic, callback) {
            var type = nucleic ? "nucleic" : "proteic";
            g.db.transaction(["sequences"], "readonly").objectStore("sequences").get(key).addEventListener("success", function(e) {
                callback(e.target.result[type], e.target.result[type + "S"]);
            }, false);
        };

        var cursorGetter = g.db.transaction(["sequencesMetadata"], "readonly").objectStore("sequencesMetadata").openCursor();
        cursorGetter.addEventListener("success", function(e) {
            var cursor = e.target.result;
            if (cursor) {
                list.push(cursor.value);
                cursor.continue();
            } else {
                g.executeAfterDOM(function() {
                    addDOM(list);
                    g.matMgr.updateDOM();
                });
                viewer();
            }
        }, false);
    } else {
        addClean = function(cleaned) {
            var item = {
                name:     cleaned.name,
                type:     cleaned.type,
                size:     cleaned.size,
                comment:  cleaned.comment,
                key:      Date.now(),
                proteic:  cleaned.proteic,
                proteicS: cleaned.proteicS
            };
            if (cleaned.type === "nucleic") {
                item.nucleic  = cleaned.nucleic;
                item.nucleicS = cleaned.nucleicS;
            }
            list.push(item);
            addDOM([item]);
        };

        g.seqMgr.get = function(key, nucleic, callback) {
            var type = nucleic ? "nucleic" : "proteic",
                item;
            for (var i = 0; i < list.length; i++) {
                if (list[i].key === key) {
                    item = list[i];
                    break;
                }
            }
            if (item) {
                callback(item[type], item[type + "S"]);
            }
        };

        viewer();
    }
};
