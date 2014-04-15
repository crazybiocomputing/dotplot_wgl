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

//miscellaneous functions and variables to be used across the whole application
"use strict";

var g = {};//custom "global" object
g.dbVersion = 1;
//internal database
g.db = null;

//sequence manager
g.seqMgr = {};
//matrix manager
g.matMgr = {};
//parameters of the currently viewed dot-plot
g.currentView = {};
//parameters of the next dot-plot analysis
g.preparedView = {};
//DOM templates
g.DOM = {
    liTempl: document.createElement("li")
};

(function() {
    var rm = document.createElement("div");
    g.DOM.liTempl.appendChild(rm.cloneNode(true));
    rm.classList.add("remove");
    rm.textContent = "×";
    g.DOM.liTempl.appendChild(rm.cloneNode(true));

    //Determine which vendor prefixes to use
    var prefixes = ["transform", "MozTransform", "WebkitTransform", "OTransform", "msTransform"];
    for (var i = 0; i < prefixes.length; i++) {
        if (typeof rm.style[prefixes[i]] !== "undefined") {
            g.DOM.transform = prefixes[i];
            break;
        }
    }
})();

g.DOMLoaded = false;

//shortcut for getElementById
g.$ = function(id) {
    return document.getElementById(id);
};

document.addEventListener("DOMContentLoaded", function() {
    g.DOMLoaded = true;
    g.DOM.li = g.$("sequence-list");
    g.DOM.opt1 = g.$("seq1");
    g.DOM.opt2 = g.$("seq2");
    g.DOM.mat = g.$("mat");
    g.DOM.type = g.$("type");
    g.DOM.names = g.$("names");
    g.DOM.inputZone = g.$("input-zone");
    g.DOM.hist = g.$("svg");
    var ranges = document.getElementsByClassName("range");
    g.DOM.range1 = ranges[0];
    g.DOM.range2 = ranges[1];
    var channels = document.getElementsByClassName("channel");
    g.DOM.red = channels[0];
    g.DOM.green = channels[1];
    g.DOM.blue = channels[2];
    g.DOM.zoom = g.$("zoom");
}, false);

//loads scripts to be executed in order
g.loadScripts = function loadScripts(scriptURLs) {
    scriptURLs.forEach(function(url) {
        var script = document.createElement("script");
        script.async = false;
        script.src = url;
        document.head.appendChild(script);
    });
};

//makes async requests
g.xhr2 = function(url, type, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = type;
    req.addEventListener("load", function() {
        if (this.status === 200) {
            callback(this.response);
        }
    }, false);
    req.send();
};

//loads shaders from the server
g.loadShaders = function(shaders, callback) {
    var responses = [];
    var aggregateResponses = function(shaderText) {
        responses.push(shaderText);
        if (responses.length === shaders.length) {
            callback(responses);
        }
    };
    shaders.forEach(function(shader) {
        g.xhr2("shaders/" + shader, "text", aggregateResponses);
    });
};
