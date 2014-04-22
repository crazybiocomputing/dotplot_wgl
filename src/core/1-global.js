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

//custom "global" object
var g = {
    //IndexedDB version and handle
    dbVersion: 1,
    db:        null,
    //WebGL variables
    context:   null,
    program:   null,
    //Managers
    seqMgr:    {},
    matMgr:    {},
    viewMgr:   {},
    //Document Object Model handles
    DOM:     {
        liTempl: document.createElement("li")
    },
    //useful functions
    //executes a function after DOM has loaded
    executeAfterDOM: function(fun) {
        if (document.readyState !== "loading") {
            fun();
        } else {
            document.addEventListener("DOMContentLoaded", fun, false);
        }
    },
    //shortcut for getElementById
    $: function(id) {
        return document.getElementById(id);
    },
    //makes custom XmlHttpRequests (version 2)
    xhr2: function(url, type, callback, i) {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = type;
        req.addEventListener("load", function() {
            if (this.status === 200) {
                callback(this.response, i);
            }
        }, false);
        req.send();
    },
};

(function() {
    var div = document.createElement("div");
    g.DOM.liTempl.appendChild(div.cloneNode(true));
    g.DOM.liTempl.appendChild(div.cloneNode(true));
    div.classList.add("remove");
    div.textContent = "×";
    g.DOM.liTempl.appendChild(div.cloneNode(true));

    //Determine which vendor prefixes to use
    var prefixes = ["transform", "MozTransform", "WebkitTransform", "OTransform", "msTransform"];
    for (var i = 0; i < prefixes.length; i++) {
        if (typeof div.style[prefixes[i]] !== "undefined") {
            g.DOM.transform = prefixes[i];
            break;
        }
    }
}());

g.executeAfterDOM(function() {
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
    g.DOM.red        = channels[0];
    g.DOM.green      = channels[1];
    g.DOM.blue       = channels[2];
    g.DOM.reinitHist = function() {
        this.range1.value  = 255;
        this.range2.value  = 0;
        this.red.checked   = true;
        this.green.checked = true;
        this.blue.checked  = true;
        this.hist.style.background = "linear-gradient(to right, #000 0, #000 0%, #fff 100%, #fff 100%)";
    };
    g.DOM.zoom       = g.$("zoom");
    g.DOM.windowSize = g.$("window");
    g.DOM.windowSize.getValue = function() {
        return Math.max(Math.round(this.value), 1);
    };
});

g.xhr2("matrices/NucleicMatrices.texture","arraybuffer",function(r){
    g.nucleicTex = new Uint8Array(r);
});
g.xhr2("matrices/ProteicMatrices.texture","arraybuffer",function(r){
    g.proteicTex = new Uint8Array(r);
});
