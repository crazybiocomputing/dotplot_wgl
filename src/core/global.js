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

/*jshint -W079*///because defining globals
/*jshint globalstrict: true*/

//miscellaneous functions and variables to be used across the whole application
"use strict";

/** @namespace */
var g = {
    //IndexedDB (database) version and handle
    dbVersion: 1,
    db:        null,
    //WebGL variables
    context:   null,
    program:   null,
    //Managers
    seqMgr:    {},
    matMgr:    {},
    viewMgr:   {},
    //Document Object Model handles and variables
    DOM:       {
        liTempl: (function() {
            var li  = document.createElement("li");
            for (var i = 0; i < 4; i++) {
                li.appendChild(document.createElement("div"));
            }
            li.children[2].classList.add("download");
            li.children[2].title = "save as fasta file";
            li.children[2].textContent = "↓";
            li.children[3].classList.add("remove");
            li.children[3].title = "remove";
            li.children[3].textContent = "×";
            return li;
        })(),
        transform: (function() {
            var test     = document.createElement("div"),
                prefixes = ["transform", "MozTransform", "WebkitTransform", "OTransform", "msTransform"];
            for (var i = 0; i < prefixes.length; i++) {
                if (test.style[prefixes[i]] !== undefined) {
                    return prefixes[i];
                }
            }
        })()
    },
    //Support for transferable objects in Workers
    //TODO check if fails with non-supporting browsers
    transf:    (function() {
        var ab = new ArrayBuffer(1),
            w  = new Worker(URL.createObjectURL(new Blob([""], {type: "application/javascript"})));
        w.postMessage(ab, [ab]);
        return ab.byteLength === 0;
    })(),
    /**
     * execute the callback function after the DOM has loaded
     * @param {function} callback - function called as callback
     */
    executeAfterDOM: function(callback) {
        if (document.readyState !== "loading") {
            callback();
        } else {
            document.addEventListener("DOMContentLoaded", callback, false);
        }
    },
    /**
     * document.getElementById shortcut
     * @param {string} id - id of the DOM element wanted
     */
    //shortcut for getElementById
    $: function(id) {
        return document.getElementById(id);
    },
    /**
     * custom XmlHttpRequests (version 2)
     * @param {string} url - URL of the wanted resource
     * @param {function} callback - callback function
     * @param {string} [type="text"] - function called at the next monitor refresh (or after 16ms)
     */
    xhr2: function(url, callback, type) {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = type;
        req.addEventListener("load", function() {
            if (this.status === 200) {
                callback(this.response);
            }
        }, false);
        req.send();
    }
};

g.executeAfterDOM(function() {
    //TODO clean rarely used variables
    g.DOM.canvas     = g.$("canvas");
    g.DOM.li         = g.$("sequence-list");
    var selects  = document.getElementsByTagName("select");
    g.DOM.opt1       = selects[0];
    g.DOM.opt2       = selects[1];
    g.DOM.mat        = selects[2];
    g.DOM.type       = selects[3];
    g.DOM.names      = g.$("names");
    g.DOM.inputZone  = g.$("input-zone");
    g.DOM.hist       = g.$("svg");
    var ranges   = document.getElementsByClassName("range");
    g.DOM.range1     = ranges[0];
    g.DOM.range2     = ranges[1];
    var channels = document.getElementsByClassName("channel");
    g.DOM.colors     = g.$("hist").firstChild;
    g.DOM.red        = channels[0];
    g.DOM.green      = channels[1];
    g.DOM.blue       = channels[2];
    g.DOM.zoom       = g.$("zoom");
    g.DOM.windowSize = g.$("window");
    g.DOM.windowSize.getValue = function() {
        return Math.max(Math.round(this.value), 1);
    };
    var sliders  = document.getElementsByClassName("picking-slider");
    g.DOM.slider1    = sliders[0];
    g.DOM.slider2    = sliders[1];
    g.DOM.pick       = g.$("picking-sequences-cont");
    var pickers  = document.getElementsByClassName("pickers");
    g.DOM.picker1    = pickers[0];
    g.DOM.picker2    = pickers[1];
});
