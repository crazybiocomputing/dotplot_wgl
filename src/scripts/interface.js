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

window.addEventListener("DOMContentLoaded", function() {
    var canvas = g.$("canvas");

    //declaring listeners
    canvas.addEventListener("click", function(e) {
        e.preventDefault();
        console.log("pixel clicked at x: " + e.layerX + ", y: " + e.layerY);
    }, false);

    g.$("download").addEventListener("click", function(e) {
        e.preventDefault();
        var ghostAnchor = g.$("ghost-anchor");
        ghostAnchor.download = "image.png";
        try {
            canvas.toBlob(function(blob) {
                ghostAnchor.href = window.URL.createObjectURL(blob);
                ghostAnchor.click();
            });
        } catch(error) {
            console.log("canvas.toBlob not supported");
            ghostAnchor.href = canvas.toDataURL();
            ghostAnchor.click();
        }
    }, false);

    g.$("clean-up").addEventListener("click", function(e) {
        e.preventDefault();
        localStorage.removeItem("alreadyVisited");
        location.reload(true);
    }, false);

    //nav buttons
    var nav = function(e) {
        e.preventDefault();
        g.$(e.target.dataset.target).classList.toggle("active-section");
    };
    Array.prototype.forEach.call(document.getElementsByClassName("internal-nav"), function(anchor) {
        anchor.addEventListener("click", nav, false);
    });

    g.$("sequence-list").addEventListener("click", function(e) {
        if (e.target.tagName === "DIV") {
            g.seqMan.remove(parseInt(e.target.dataset.key));
        }
    }, false);

    var cleanAfterInput = function() {
        g.DOM.names.value = "";
        g.DOM.type.value = "unknown";
        g.DOM.inputZone.value = "";
        g.$("new-sequence").classList.remove("active-section");
    };
    g.DOM.inputZone.addEventListener("dragover", function(e) {
        e.stopPropagation();
        e.preventDefault();
        g.DOM.inputZone.classList.add("hovering");
        e.dataTransfer.dropEffect = "copy";
    }, false);
    g.DOM.inputZone.addEventListener("dragleave", function(e) {
        e.stopPropagation();
        e.preventDefault();
        g.DOM.inputZone.classList.remove("hovering");
    }, false);
    g.DOM.inputZone.addEventListener("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();
        g.DOM.inputZone.classList.remove("hovering");
        Array.prototype.forEach.call(e.dataTransfer.files, function(file) {
            g.seqMan.add(file, g.DOM.names.value, g.DOM.type.value);
        });
        cleanAfterInput();
    }, false);

    g.$("input-submit").addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        g.seqMan.add(g.DOM.inputZone.value, g.DOM.names.value, g.DOM.type.value);
        cleanAfterInput();
    }, false);

    g.DOM.hist = g.$("svg");
    var fragment = document.createDocumentFragment();
    var barCount = document.createElementNS("http://www.w3.org/2000/svg", "line");
    barCount.classList.add("count");
    barCount.setAttribute("y1", "200.5%");
    barCount.setAttribute("y2", "100.5%");
    barCount.style.stroke = "#06F";
    barCount.style.strokeWidth = 1;
    var barLog = document.createElementNS("http://www.w3.org/2000/svg", "line");
    barLog.classList.add("log");
    barLog.setAttribute("y1", "101.5%");
    barLog.setAttribute("y2", "100.5%");
    barLog.style.stroke = "#f0e";
    barLog.style.strokeWidth = 1;
    for (var i = 0; i < 256; i++) {//create 256 bars
        var barC = barCount.cloneNode();//copy the one defined
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
