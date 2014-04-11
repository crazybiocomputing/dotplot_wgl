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

//failing in strict mode
//var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
//var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
//var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var g = {};//custom "global" object
g.dbVersion = 1;
//internal database
g.db = null;

//sequence manager
g.seqMan = {};
//matrix manager
g.matMan = {};
//parameters of the currently viewed dot-plot
g.currentView = {};
//parameters of the next dot-plot analysis
g.preparedView = {};
//DOM templates;
g.DOM = {
    liTempl: document.createElement("li"),
    optTempl: document.createElement("option")
};

(function() {
    var rm = document.createElement("div");
    g.DOM.liTempl.appendChild(rm.cloneNode(true));
    rm.classList.add("remove");
    rm.textContent = "×";
    g.DOM.liTempl.appendChild(rm.cloneNode(true));
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
    g.DOM.type = g.$("type");
    g.DOM.names = g.$("names");
    g.DOM.inputZone = g.$("input-zone");

    g.DOM.hist = document.getElementsByTagName("svg")[0];
    var fragment = document.createDocumentFragment();
    var barCount = document.createElementNS("http://www.w3.org/2000/svg", "line");
    barCount.setAttribute("y1", 200.5);
    barCount.setAttribute("y2", 100.5);
    barCount.style.stroke = "#06F";
    barCount.style.strokeWidth = 1;
    var barLog = document.createElementNS("http://www.w3.org/2000/svg", "line");
    barLog.setAttribute("y1", 101.5);
    barLog.setAttribute("y2", 100.5);
    barLog.style.stroke = "#f0e";
    barLog.style.strokeWidth = 1;
    for (var i = 0; i < 256; i++) {//create 256 bars
        var barC = barCount.cloneNode(); //copy the one defined
        barC.setAttribute("x1", i + 0.5);
        barC.setAttribute("x2", i + 0.5);
        fragment.appendChild(barC);
        var barL = barLog.cloneNode();
        barL.setAttribute("x1", i + 0.5);
        barL.setAttribute("x2", i + 0.5);
        fragment.appendChild(barL);
    }
    g.DOM.hist.appendChild(fragment);
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
