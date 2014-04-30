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

/*exported viewer*/
var viewer = function() {
    g.viewMgr.rendering = false;
    var histData = {},
        gl, prog;

    var prepareShaders = function(fragment) {
        var vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, g.viewMgr.DotPlot);
        gl.compileShader(vert);
        gl.attachShader(prog, vert);
        var frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, g.viewMgr[fragment]);
        gl.compileShader(frag);
        gl.attachShader(prog, frag);
    };

    var render = function(params) {
        console.time("1");
        g.DOM.range1.value  = 255;
        g.DOM.range2.value  = 0;
        g.DOM.red.checked   = true;
        g.DOM.green.checked = true;
        g.DOM.blue.checked  = true;
        g.DOM.hist.style.background = "linear-gradient(to right, #000 0, #000 0%, #fff 100%, #fff 100%)";
        g.DOM.slider1.value = 0;
        g.DOM.slider2.value = 0;
        var wS = g.DOM.windowSize.getValue(),
        w, h;
        if (params.compType % 2) {
            if (params.compType === 3) {
                w = Math.floor(params.seq1.size / 3);
                h = params.seq2.size;
            } else {
                w = params.seq1.size;
                h = Math.floor(params.seq2.size / 3);
            }
        } else {
            w = params.seq1.size;
            h = params.seq2.size;
        }
        g.$("window-viewer").style.width = wS + "ch";
        g.DOM.canvas.width         = w;
        g.DOM.canvas.height        = h;
        g.DOM.canvas.style.width   = w + "px";
        g.DOM.canvas.style.height  = h + "px";
        g.DOM.picker1.style.height = (h + 1 - wS) + "px";
        g.DOM.picker2.style.width  = (w + 1 - wS) + "px";
        gl = g.context = g.DOM.canvas.getContext(
            "webgl", {alpha: false, preserveDrawingBuffer: true}
        ) || g.DOM.canvas.getContext(
            "experimental-webgl", {alpha: false, preserveDrawingBuffer: true}
        );
        gl.viewport(0, 0, w, h);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        prog = g.program = gl.createProgram();

        switch (params.compType) {
            case 0:
                prepareShaders("ProteicProteic");
                break;
            case 1:
                prepareShaders("ProteicNucleic");
                break;
            case 2:
                prepareShaders("NucleicNucleic");
                break;
            case 3:
                prepareShaders("NucleicProteic");
                break;
        }

        gl.linkProgram(prog);
        gl.useProgram(prog);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1,  1,  1,  1,  1, -1,
            -1,  1,  1, -1, -1, -1
        ]), gl.STATIC_DRAW);
        var vertexPosAttrib = gl.getAttribLocation(prog, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPosAttrib);
        gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(gl.getUniformLocation(prog, "uSamplerMat"), 0);
        gl.uniform1i(gl.getUniformLocation(prog, "uSampler1"), 1);
        gl.uniform1i(gl.getUniformLocation(prog, "uSampler2"), 2);

        gl.uniform2f(gl.getUniformLocation(prog, "uSizes"), w, h);

        var tex = (params.compType === 2) ? g.nucleicTex : g.proteicTex;
        var texWidth = (params.compType === 2) ? 16 : 24;
        gl.uniform2f(gl.getUniformLocation(prog, "uOffset"), params.offset * texWidth / tex.length, texWidth * texWidth / tex.length);

        gl.uniform1i(gl.getUniformLocation(prog, "uWindow"), wS);

        gl.uniform3i(gl.getUniformLocation(prog, "uColors"), 1, 1, 1);

        gl.uniform2f(gl.getUniformLocation(prog, "uTransfer"), 1.0, 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1, 0, 1, 1,
            0, 0, 1, 1, 0, 1
        ]), gl.STATIC_DRAW);
        var texCoordLocation = gl.getAttribLocation(prog, "aTexCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, texWidth, tex.length / texWidth, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        var texLoaded = false;
        g.seqMgr.get(params.seq1.key, params.compType === 2, function(texture, string) {
            g.DOM.slider1.max    = w - 1;
            g.DOM.pickDiv1       = document.createElement("div");
            g.DOM.pickDiv1.title = params.seq1.name;
            g.DOM.pickDiv1.classList.add("picking-sequences");
            if (params.seq1.type === params.seq2.type) {
                if (params.seq1.type === "proteic") {
                    for (var i = 0; i < string.length; i++) {
                        var temp = document.createElement("span");
                        temp.textContent = string.charAt(i);
                        g.DOM.pickDiv1.appendChild(temp);
                    }
                } else {
                    var forward = document.createElement("div"),
                        reverse = document.createElement("div");
                    for (var i = 0; i < string.length; i++) {
                        var temp1 = document.createElement("span"),
                            temp2 = document.createElement("span");
                        temp1.textContent = string.charAt(i);
                        temp2.textContent = string.charAt(string.length - 1 - i);
                        forward.appendChild(temp1);
                        reverse.appendChild(temp2);
                    }
                    g.DOM.pickDiv1.appendChild(forward);
                    g.DOM.pickDiv1.appendChild(reverse);
                }
            } else {
                string.forEach(function(string) {
                    var tempDiv = document.createElement("div");
                    for (var i = 0; i < string.length; i++) {
                        var temp = document.createElement("span");
                        temp.textContent = string.charAt(i);
                        tempDiv.appendChild(temp);
                    }
                    g.DOM.pickDiv1.appendChild(tempDiv);
                });
            }
            g.DOM.pick.replaceChild(g.DOM.pickDiv1, g.DOM.pick.children[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            if (params.seq1.type === "nucleic") {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, texture);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texture);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            if (texLoaded) {
                g.viewMgr.draw(true);
            } else {
                texLoaded = true;
            }
        });

        g.seqMgr.get(params.seq2.key, params.compType === 2, function(texture, string) {
            g.DOM.slider2.max    = h - 1;
            g.DOM.pickDiv2       = document.createElement("div");
            g.DOM.pickDiv2.title = params.seq2.name;
            g.DOM.pickDiv2.classList.add("picking-sequences");
            if (typeof string === "string") {
                for (var i = 0; i < string.length; i++) {
                    var temp = document.createElement("span");
                    temp.textContent = string.charAt(i);
                    g.DOM.pickDiv2.appendChild(temp);
                }
            } else {
                string.forEach(function(string) {
                    var tempDiv = document.createElement("div");
                    for (var i = 0; i < string.length; i++) {
                        var temp = document.createElement("span");
                        temp.textContent = string.charAt(i);
                        tempDiv.appendChild(temp);
                    }
                    g.DOM.pickDiv2.appendChild(tempDiv);
                });
            }
            g.DOM.pick.replaceChild(g.DOM.pickDiv2, g.DOM.pick.children[1]);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            if (params.seq2.type === "nucleic") {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, h, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, texture);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, h, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texture);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            if (texLoaded) {
                g.viewMgr.draw(true);
            } else {
                texLoaded = true;
            }
        });
    };

    var renderHist = function() {
        var w = new Worker("core/workers/histogram.js");
        w.addEventListener("message", function(message) {
            Object.keys(message.data).forEach(function(key) {
                histData[key] = message.data[key];
            });
            g.DOM.countHist("RGB");
        }, false);
        var wS = g.DOM.windowSize.getValue();
        var pixels = new Uint8Array((g.DOM.canvas.width + 1 - wS) * (g.DOM.canvas.height + 1 - wS) * 4);
        gl.readPixels(0, wS - 1, g.DOM.canvas.width + 1 - wS, g.DOM.canvas.height + 1 - wS, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        w.postMessage({
            pixels: pixels,
            transf: g.transf
        });
    };

    g.viewMgr.draw = function(updateHist) {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (updateHist) {
            renderHist();
            g.viewMgr.pick(0, 0);
        }
        g.$("window-viewer").style.width = g.DOM.windowSize.getValue() + "ch";
        var webglInput      = g.$("webgl");
        webglInput.value    = "Render WebGL graph";
        g.rAF(function() {
            webglInput.disabled = false;
        });
        g.viewMgr.rendering = false;
        console.timeEnd("1");
    };

    g.DOM.countHist = function(channels) {
        for (var i = 0; i < 256; i++) {
            g.DOM.hist.children[i * 2].style[g.DOM.transform] = "translate3d(0, -" + ((channels ? (histData.histCount[channels][i] / histData.maxCount[channels]) : 0) * 200) + "px, 0)";
            g.DOM.hist.children[i * 2 + 1].style[g.DOM.transform] = "translate3d(0, -" + ((channels ? (histData.histLog[channels][i] / histData.maxLog[channels]) : 0) * 200) + "px, 0)";
        }
        if (!channels) {//all black
            g.DOM.hist.children[0].style[g.DOM.transform] = "translate3d(0, -200px, 0)";
            g.DOM.hist.children[1].style[g.DOM.transform] = "translate3d(0, -200px, 0)";
        }
    };

    g.viewMgr.pick = function(x, y) {
        if (x !== undefined && x < g.DOM.canvas.width) {
            g.DOM.slider1.value = Math.min(x, g.DOM.slider1.max);
            g.DOM.pickDiv1.style[g.DOM.transform] = "translateZ(0) translateX(-" + x + "ch)";
            g.DOM.picker1.style[g.DOM.transform] = "translateZ(0) translateX(" + x + "px)";
        }
        if (y !== undefined && y < g.DOM.canvas.height) {
            g.DOM.slider2.value = Math.min(y, g.DOM.slider2.max);
            g.DOM.pickDiv2.style[g.DOM.transform] = "translateZ(0) translateX(-" + y + "ch)";
            g.DOM.picker2.style[g.DOM.transform] = "translateZ(0) translateY(" + y + "px)";
        }
    };

    ["DotPlot.vs", "NucleicNucleic.fs", "NucleicProteic.fs", "ProteicNucleic.fs", "ProteicProteic.fs"].forEach(function(shaderFile) {
        g.xhr2("shaders/" + shaderFile, function(shader) {
            g.viewMgr[shaderFile.split(".")[0]] = shader;
        });
    });

    g.executeAfterDOM(function() {
        var webglInput = g.$("webgl");
        webglInput.addEventListener("click", function() {
            if (!g.viewMgr.rendering) {
                g.viewMgr.rendering = true;
                webglInput.disabled = true;
                webglInput.value    = "Rendering…";
                var offset = parseInt(g.DOM.mat.options[g.DOM.mat.selectedIndex].dataset.offset);
                g.DOM.red.disabled   = false;
                g.DOM.green.disabled = false;
                g.DOM.blue.disabled  = false;
                var seq1 = g.DOM.opt1.options[g.DOM.opt1.selectedIndex],
                    seq2 = g.DOM.opt2.options[g.DOM.opt2.selectedIndex],
                    compType;
                if (seq1.dataset.type === seq2.dataset.type) {
                    if (seq2.dataset.type === "nucleic") {
                        compType = 2;
                        g.DOM.colors.textContent = "Nucleic strand:";
                        g.DOM.red.nextElementSibling.textContent   = "forward";
                        g.DOM.green.nextElementSibling.textContent = "reverse";
                        g.DOM.blue.nextElementSibling.textContent  = "reverse comp.";
                    } else {
                        compType = 0;
                        g.DOM.red.disabled   = true;
                        g.DOM.green.disabled = true;
                        g.DOM.blue.disabled  = true;
                        g.DOM.colors.textContent = "";
                        g.DOM.red.nextElementSibling.textContent   = "";
                        g.DOM.green.nextElementSibling.textContent = "";
                        g.DOM.blue.nextElementSibling.textContent  = "";
                    }
                } else {
                    g.DOM.colors.textContent = "Reading frame offsets:";
                    g.DOM.red.nextElementSibling.textContent   = "0";
                    g.DOM.green.nextElementSibling.textContent = "1";
                    g.DOM.blue.nextElementSibling.textContent  = "2";
                    if (seq2.dataset.type === "nucleic") {
                        compType = 1;
                    } else {
                        compType = 3;
                    }
                }
                render({
                    seq1: {
                        type: seq1.dataset.type,
                        key:  parseInt(seq1.dataset.key),
                        name: seq1.textContent,
                        size: parseInt(seq1.dataset.size)
                    },
                    seq2: {
                        type: seq2.dataset.type,
                        key:  parseInt(seq2.dataset.key),
                        name: seq2.textContent,
                        size: parseInt(seq2.dataset.size)
                    },
                    compType: compType,
                    offset: offset
                });
            }
        }, false);
        webglInput.disabled = false;
    });
};
