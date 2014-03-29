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

/*jshint -W020*/

"use strict";

(function() {
    //TODO Provide demo sequences
    var sequencesMetadata = [{key: 1, name: "demo sequence", protein: false}];
    var sequences = [{key: 1, typedArray: new Uint8Array(8)}];

    window.indexedDB.deleteDatabase("dotplot");
    var request = window.indexedDB.open("dotplot", dbVersion);

    request.addEventListener("error", function(e) {
        console.log("Error opening the DB");
        console.log(e);
        alert("Error opening the DB");
    }, false);

    request.addEventListener("success", function(e) {
        console.log("Success opening the DB");
        db = e.target.result;
        var transaction = db.transaction(
            ["sequencesMetadata", "sequences"],
            "readwrite"
        );

        var sequencesMetadataOS = transaction.objectStore("sequencesMetadata");
        var sequencesOS = transaction.objectStore("sequences");
        for (var i = 0; i < sequences.length; i++) {
            sequencesMetadataOS.add(sequencesMetadata[i]);
            sequencesOS.add(sequences[i]);
        }

        transaction.addEventListener("complete", function() {
            console.log("objects stored in DB");
            localStorage.setItem("alreadyVisited", true);
            loadScripts(["scripts/matrices.js", "scripts/sequences.js"]);
        }, false);

    }, false);

    request.addEventListener("upgradeneeded", function(e) {
        console.log("Upgrading the DB...");
        db = e.target.result;

        if (db.objectStoreNames.contains("sequencesMetadata")) {
            db.deleteObjectStore("sequencesMetadata");
        }
        db.createObjectStore("sequencesMetadata", {keyPath: "key", autoIncrement: true});

        if (db.objectStoreNames.contains("sequences")) {
            db.deleteObjectStore("sequences");
        }
        db.createObjectStore("sequences", {keyPath: "key"});
    }, false);
})();
