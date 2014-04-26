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

g.executeAfterDOM(function() {
    var innerContainer = g.$("inner-container");
    innerContainer.style[g.DOM.transform] = "translateZ(0) scale(1)";

    //declaring listeners
    innerContainer.addEventListener("click", function(e) {
        var rect = this.getBoundingClientRect();
        g.viewMgr.pick(
            Math.floor((e.clientX - rect.left - e.target.clientLeft + e.target.scrollLeft) * g.DOM.zoom.value),
            Math.floor((e.clientY - rect.top - e.target.clientTop + e.target.scrollTop) * g.DOM.zoom.value)
        );
    }, false);

    g.DOM.windowSize.addEventListener("input", function() {
        g.DOM.range1.value = 255;
        g.DOM.range2.value = 0;
        g.DOM.hist.style.background = "";
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uMax");
        g.context.uniform1f(g.program.windowUniform, 1.0);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uMin");
        g.context.uniform1f(g.program.windowUniform, 0.0);
        g.context.clear(g.context.COLOR_BUFFER_BIT|g.context.DEPTH_BUFFER_BIT);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uWindow");
        g.context.uniform1i(g.program.windowUniform, g.DOM.windowSize.getValue());
        g.viewMgr.draw(true);
    });

    g.$("download").addEventListener("click", function() {
        var ghostAnchor = g.$("ghost-anchor");
        ghostAnchor.download = "image.png";
        try {
            g.DOM.canvas.toBlob(function(blob) {
                ghostAnchor.href = window.URL.createObjectURL(blob);
                ghostAnchor.click();
            });
        } catch(err) {
            ghostAnchor.href = g.DOM.canvas.toDataURL();
            ghostAnchor.click();
        }
    }, false);

    g.$("fullscreen").addEventListener("click", function() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }
    }, false);

    g.DOM.zoom.addEventListener("input", function(e) {
        g.$("inner-container").style[g.DOM.transform] = g.$("inner-container").style[g.DOM.transform].replace(/scale\(\d+\.?\d*\)/, "scale(" + (1/e.target.value) + ")");
    }, false);

    g.$("clean-up").addEventListener("click", function() {
        indexedDB.deleteDatabase("dotplot");
        try {
            localStorage.removeItem("alreadyVisited");
        } catch(err) {}
        location.reload(true);
    }, false);

    if (Notification && Notification.permission !== "granted") {
        g.$("notifications").addEventListener("click", function() {
            Notification.requestPermission(function(e) {
                if (e === "granted") {
                    new Notification("Success", {body: "Notifications will now be used when importing sequences", icon: "images/favicon-128.png"});
                }
            });
        }, false);
    } else {
        g.$("notifications").classList.add("hidden");
    }

    if (navigator.mozApps) {//supports Open Web Apps
        var manifest = location.href.substring(0, location.href.lastIndexOf("/")) + "/manifest.webapp";
        var req = navigator.mozApps.checkInstalled(manifest);
        req.addEventListener("success", function(e) {
            if (e.result) {//already installed
                g.$("install").classList.add("hidden");
            } else {//propose to install on click
                g.$("install").addEventListener("click", function() {
                    var req = navigator.mozApps.install(manifest);
                    req.addEventListener("success", function() {
                        alert("Installed successfully. Tou can now close this tab and open your application like any other application");
                    }, false);
                    req.addEventListener("error", function(err) {
                        alert("Error: " + err.name);
                    }, false);
                }, false);
            }
        }, false);
    } else {
        g.$("install").classList.add("hidden");
    }

    //nav buttons
    var nav = function(e) {
        g.$(e.target.dataset.target).classList.toggle("active-section");
    };
    Array.prototype.forEach.call(document.getElementsByClassName("internal-nav"), function(anchor) {
        anchor.addEventListener("click", nav, false);
    });

    g.$("sequence-list").addEventListener("click", function(e) {
        if (e.target.tagName === "DIV") {
            g.seqMgr.remove(parseInt(e.target.dataset.key));
        }
    }, false);

    var cleanAfterInput = function() {
        g.DOM.names.value = "";
        g.DOM.type.value = "unknown";
        g.DOM.inputZone.value = "";
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
            g.seqMgr.add(file, g.DOM.names.value, g.DOM.type.value);
        });
        cleanAfterInput();
    }, false);

    g.$("input-submit").addEventListener("click", function() {
        g.seqMgr.add(g.DOM.inputZone.value, g.DOM.names.value, g.DOM.type.value);
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

    var updateColor = function() {
        var v1    = g.DOM.range1.value / 2.55,
            v2    = g.DOM.range2.value / 2.55,
            color = (g.DOM.red.checked ? "f" : "0") + (g.DOM.green.checked ? "f" : "0") + (g.DOM.blue.checked ? "f" : "0");
        if (v1 >= v2) {
            g.DOM.hist.style.background = "linear-gradient(to right, #000 0, #000 " + v2 + "%, #" + color + " " + v1 + "%, #" + color + " 100%)";
        } else {
            g.DOM.hist.style.background = "linear-gradient(to right, #" + color + " 0, #" + color + " " + v1 + "%, #000 " + v2 + "%, #000 100%)";
        }
        g.DOM.countHist((g.DOM.red.checked ? "R" : "") + (g.DOM.green.checked ? "G" : "") + (g.DOM.blue.checked ? "B" : ""));

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uColors");
        g.context.uniform3i(g.program.windowUniform, g.DOM.red.checked ? 1 : 0, g.DOM.green.checked ? 1 : 0, g.DOM.blue.checked ? 1 : 0);
        g.viewMgr.draw(false);
    };

    g.DOM.red.addEventListener("change", updateColor, false);
    g.DOM.green.addEventListener("change", updateColor, false);
    g.DOM.blue.addEventListener("change", updateColor, false);

    var linearEq = function(y1, y2) {
        var a = 100 / (y2 - y1);
        return {
            a: a,
            b: -a * y1 / 100
        };
    };

    var updateTransfer = function() {
        var v1    = g.DOM.range1.value / 2.55,
            v2    = g.DOM.range2.value / 2.55,
            color = (g.DOM.red.checked ? "f" : "0") + (g.DOM.green.checked ? "f" : "0") + (g.DOM.blue.checked ? "f" : "0");
        if (v1 >= v2) {
            g.DOM.hist.style.background = "linear-gradient(to right, #000 0, #000 " + v2 + "%, #" + color + " " + v1 + "%, #" + color + " 100%)";
        } else {
            g.DOM.hist.style.background = "linear-gradient(to right, #" + color + " 0, #" + color + " " + v1 + "%, #000 " + v2 + "%, #000 100%)";
        }

        var params = linearEq(v2, v1);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uTransfer");
        g.context.uniform2f(g.program.windowUniform, params.a, params.b);
        g.viewMgr.draw(false);
    };

    g.DOM.range1.addEventListener("input", updateTransfer, false);
    g.DOM.range2.addEventListener("input", updateTransfer, false);

    g.DOM.slider1.addEventListener("input", function(e) {
        g.viewMgr.pick(e.target.value);
    }, false);
    g.DOM.slider2.addEventListener("input", function(e) {
        g.viewMgr.pick(null, e.target.value);
    }, false);
});
