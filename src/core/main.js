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

(function() {
    var testCanvas = document.createElement("canvas");
    if (window.Worker && window.WebGLRenderingContext && (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"))) {//test limiting features
        g.executeAfterDOM(function () {
            g.$("compatibility").classList.add("hidden");
        });
    } else {
        document.addEventListener("click", function() {
            g.$("compatibility").classList.add("hidden");
            document.removeEventListener("click", arguments.callee, false);
        }, false);
    }
    var firstLoad = function() {
        var script = document.createElement("script");
        script.src = "core/firstLoad.js";
        document.head.appendChild(script);
    };
    if (window.indexedDB) {
        var request = window.indexedDB.open("dotplot", 1);
        request.addEventListener("error", function() {
            console.log("Error opening the DB, loading data in memory");
            setTimeout(function() {
                g.matMgr = new MatrixManager();
                g.seqMgr = new SequenceManager();
                firstLoad();
            }, 100);
        }, false);

        request.addEventListener("success", function(e) {
            g.db     = e.target.result;
            g.matMgr = new MatrixManager();
            g.seqMgr = new SequenceManager();
            if (!localStorage.getItem("alreadyVisited")) {
                firstLoad();
            }
        }, false);

        request.addEventListener("upgradeneeded", function(e) {
            g.db = e.target.result;
            if (!g.db.objectStoreNames.contains("sequencesMetadata")) {
                g.db.createObjectStore("sequencesMetadata", {keyPath: "key"});
            }
            if (!g.db.objectStoreNames.contains("sequences")) {
                g.db.createObjectStore("sequences", {autoIncrement: true});
            }
        }, false);
    } else {
        g.matMgr = new MatrixManager();
        g.seqMgr = new SequenceManager();
        firstLoad();
    }
})();
