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
    canvas.style[g.DOM.transform] = "translateZ(0) scale(1)";

    //declaring listeners
    canvas.addEventListener("click", function(e) {
        console.log(e);
        var rect = this.getBoundingClientRect();
        var x = Math.round((e.clientX - rect.left - e.target.clientLeft + e.target.scrollLeft) * g.DOM.zoom.value);
        var y = Math.round((e.clientY - rect.top - e.target.clientTop + e.target.scrollTop) * g.DOM.zoom.value);
        console.log("pixel clicked at x: " + x + ", y: " + y);
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

    g.$("fullscreen").addEventListener("click", function() {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.mozRequestFullScreen) {
            document.body.mozRequestFullScreen();
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen();
        }
    }, false);

    g.DOM.zoom.addEventListener("input", function(e) {
        canvas.style[g.DOM.transform] = canvas.style[g.DOM.transform].replace(/scale\(\d+\.?\d*\)/, "scale(" + (1/e.target.value) + ")");
    }, false);

    g.$("clean-up").addEventListener("click", function() {
        localStorage.removeItem("alreadyVisited");
        location.reload(true);
    }, false);

    g.$("notifications").addEventListener("click", function() {
        if (Notification) {
            Notification.requestPermission(function(e) {
                if (e === "granted") {
                    new Notification("Success", {body: "Notifications will now be used when importing sequences"});
                }
            });
        }
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
    for (var i = 0.5; i < 256; i++) {//create 256 bars
        var barC = barCount.cloneNode();//copy the one defined
        barC.setAttribute("x1", i);
        barC.setAttribute("x2", i);
        fragment.appendChild(barC);
        var barL = barLog.cloneNode();
        barL.setAttribute("x1", i);
        barL.setAttribute("x2", i);
        fragment.appendChild(barL);
    }
    g.DOM.hist.appendChild(fragment);

    var updateView = function() {
        var v1 = g.DOM.range1.value / 2.55,
            v2 = g.DOM.range2.value / 2.55,
            color = (g.DOM.red.checked ? "f" : "0") + (g.DOM.green.checked ? "f" : "0") + (g.DOM.blue.checked ? "f" : "0");
        if (v1 >= v2) {
            g.DOM.hist.style.background = "linear-gradient(to right, #000 0, #000 " + v2 + "%, #" + color + " " + v1 + "%, #" + color + " 100%)";
        } else {
            g.DOM.hist.style.background = "linear-gradient(to right, #" + color + " 0, #" + color + " " + v1 + "%, #000 " + v2 + "%, #000 100%)";
        }
        //update WebGL view
    };
    g.DOM.red.addEventListener("change", updateView, false);
    g.DOM.green.addEventListener("change", updateView, false);
    g.DOM.blue.addEventListener("change", updateView, false);
    g.DOM.range1.addEventListener("input", updateView, false);
    g.DOM.range2.addEventListener("input", updateView, false);
}, false);
