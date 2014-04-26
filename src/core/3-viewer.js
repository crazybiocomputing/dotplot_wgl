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
    var histData = {};
    var texMat   = {
        type:   null
    };

    var prepareShaders = function(fragment) {
        var vert = g.context.createShader(g.context.VERTEX_SHADER);
        g.context.shaderSource(vert, g.viewMgr.DotPlot);
        g.context.compileShader(vert);
        g.context.attachShader(g.program, vert);
        var frag = g.context.createShader(g.context.FRAGMENT_SHADER);
        g.context.shaderSource(frag, g.viewMgr[fragment]);
        g.context.compileShader(frag);
        g.context.attachShader(g.program, frag);
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
        var w = params.seq1.size,
            h = params.seq2.size,
            wS = g.DOM.windowSize.getValue();
        g.$("window-viewer").style.width = wS + "ch";
        g.DOM.canvas.width         = w;
        g.DOM.canvas.height        = h;
        g.DOM.canvas.style.width   = w + "px";
        g.DOM.canvas.style.height  = h + "px";
        g.DOM.picker1.style.height = (h + 1 - wS) + "px";
        g.DOM.picker2.style.width  = (w + 1 - wS) + "px";
        g.context = g.DOM.canvas.getContext(
            "webgl", {alpha: false, preserveDrawingBuffer: true}
        ) || g.DOM.canvas.getContext(
            "experimental-webgl", {alpha: false, preserveDrawingBuffer: true}
        );
        g.context.viewport(0, 0, w, h);
        g.context.clearColor(1.0, 1.0, 1.0, 1.0);
        g.context.clear(g.context.COLOR_BUFFER_BIT|g.context.DEPTH_BUFFER_BIT);

        g.program = g.context.createProgram();

        if (params.nucleicMatrix) {
            prepareShaders("NucleicNucleic");
        } else {
            if (params.seq1.type === params.seq2.type) {
                prepareShaders("ProteicProteic");
            } else {
                if (params.seq1.type === "proteic") {
                    prepareShaders("ProteicNucleic");
                } else {
                    prepareShaders("NucleicProteic");
                }
            }
        }

        g.context.linkProgram(g.program);
        g.context.useProgram(g.program);

        g.context.bindBuffer(g.context.ARRAY_BUFFER, g.context.createBuffer());
        g.context.bufferData(g.context.ARRAY_BUFFER, new Float32Array([
            -1,  1,  1,  1,  1, -1,
            -1,  1,  1, -1, -1, -1
        ]), g.context.STATIC_DRAW);
        g.program.vertexPosAttrib = g.context.getAttribLocation(g.program, "aVertexPosition");
        g.context.enableVertexAttribArray(g.program.vertexPosArray);
        g.context.vertexAttribPointer(g.program.vertexPosAttrib, 2, g.context.FLOAT, false, 0, 0);

        g.program.umat = g.context.getUniformLocation(g.program, "uSamplerMat");
        g.context.uniform1i(g.program.umat, 0);
        g.program.utex1 = g.context.getUniformLocation(g.program, "uSampler1");
        g.context.uniform1i(g.program.utex1, 1);
        g.program.utex2 = g.context.getUniformLocation(g.program, "uSampler2");
        g.context.uniform1i(g.program.utex2, 2);

        g.program.sizesUniform = g.context.getUniformLocation(g.program, "uSizes");
        g.context.uniform2f(g.program.sizesUniform, w, h);

        texMat.type = (params.seq1.type === "proteic" || params.seq2.type === "proteic" ) ? "proteic" : "nucleic";

        var tex = params.nucleicMatrix ? g.nucleicTex : g.proteicTex;
        var texWidth = params.nucleicMatrix ? 16 : 24;
        g.program.sizesUniform = g.context.getUniformLocation(g.program, "uOffset");
        g.context.uniform2f(g.program.sizesUniform, params.offset * texWidth / tex.length, texWidth * texWidth / tex.length);

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uWindow");
        g.context.uniform1i(g.program.windowUniform, wS);

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uColors");
        g.context.uniform3i(g.program.windowUniform, 1, 1, 1);

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uTransfer");
        g.context.uniform2f(g.program.windowUniform, 1.0, 0.0);

        var texCoordLocation = g.context.getAttribLocation(g.program, "aTexCoord");
        g.context.bindBuffer(g.context.ARRAY_BUFFER, g.context.createBuffer());
        g.context.bufferData(g.context.ARRAY_BUFFER, new Float32Array([
            0, 0, 1, 0, 1, 1,
            0, 0, 1, 1, 0, 1
        ]), g.context.STATIC_DRAW);
        g.context.enableVertexAttribArray(texCoordLocation);
        g.context.vertexAttribPointer(texCoordLocation, 2, g.context.FLOAT, false, 0, 0);

        var mat = g.context.createTexture();
        g.context.activeTexture(g.context.TEXTURE0);
        g.context.bindTexture(g.context.TEXTURE_2D, mat);
        g.context.texImage2D(g.context.TEXTURE_2D, 0, g.context.LUMINANCE, texWidth, tex.length / texWidth, 0, g.context.LUMINANCE, g.context.UNSIGNED_BYTE, tex);
        g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_S, g.context.CLAMP_TO_EDGE);
        g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_T, g.context.CLAMP_TO_EDGE);
        g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MAG_FILTER, g.context.NEAREST);
        g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MIN_FILTER, g.context.NEAREST);

        var texLoaded = false;
        g.seqMgr.get(params.seq1.key, texMat.type, function(texture, string) {
            g.DOM.slider1.max    = texture.length - wS;
            g.DOM.pickDiv1       = document.createElement("div");
            g.DOM.pickDiv1.title = params.seq1.name;
            g.DOM.pickDiv1.classList.add("picking-sequences");
            if (typeof string === "string") {
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
            var tex = g.context.createTexture();
            g.context.activeTexture(g.context.TEXTURE1);
            g.context.bindTexture(g.context.TEXTURE_2D, tex);
            g.context.texImage2D(g.context.TEXTURE_2D, 0, g.context.LUMINANCE, w, 1, 0, g.context.LUMINANCE, g.context.UNSIGNED_BYTE, texture);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_S, g.context.CLAMP_TO_EDGE);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_T, g.context.CLAMP_TO_EDGE);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MAG_FILTER, g.context.NEAREST);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MIN_FILTER, g.context.NEAREST);
            if (texLoaded) {
                g.viewMgr.draw(true);
            } else {
                texLoaded = true;
            }
        });

        g.seqMgr.get(params.seq2.key, texMat.type, function(texture, string) {
            g.DOM.slider2.max    = texture.length - wS;
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
            var tex = g.context.createTexture();
            g.context.activeTexture(g.context.TEXTURE2);
            g.context.bindTexture(g.context.TEXTURE_2D, tex);
            g.context.texImage2D(g.context.TEXTURE_2D, 0, g.context.LUMINANCE, h, 1, 0, g.context.LUMINANCE, g.context.UNSIGNED_BYTE, texture);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_S, g.context.CLAMP_TO_EDGE);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_T, g.context.CLAMP_TO_EDGE);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MAG_FILTER, g.context.NEAREST);
            g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MIN_FILTER, g.context.NEAREST);
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
            if (typeof message.data.byteLength === "undefined") {
                Object.keys(message.data).forEach(function(key) {
                    histData[key] = message.data[key];
                });
                g.DOM.countHist("RGB");
            }
        }, false);
        var wS = g.DOM.windowSize.getValue();
        //FIXME problem with window size (white pixels)
        var pixels = new Uint8Array((g.DOM.canvas.width + 1 - wS) * (g.DOM.canvas.height + 1 - wS) * 4);
        //console.log(pixels.length);
        g.context.readPixels(0, 0, g.DOM.canvas.width + 1 - wS, g.DOM.canvas.height + 1 - wS, g.context.RGBA, g.context.UNSIGNED_BYTE, pixels);
        /*console.log(pixels[0]);
        console.log(pixels[1]);
        console.log(pixels[2]);
        console.log(pixels[3]);
        console.log(pixels[4]);*/
        w.postMessage({pixels: pixels});
    };

    g.viewMgr.draw = function(updateHist) {
        g.context.drawArrays(g.context.TRIANGLES, 0, 6);
        if (updateHist) {
            renderHist();
            g.viewMgr.pick(0, 0);
        }
        g.$("window-viewer").style.width = g.DOM.windowSize.getValue() + "ch";
        var webglInput      = g.$("webgl");
        webglInput.value    = "Render WebGL graph";
        webglInput.disabled = false;
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
        if (x !== undefined) {
            g.DOM.slider1.value = Math.min(x, g.DOM.slider1.max);
            g.DOM.pickDiv1.style[g.DOM.transform] = "translateZ(0) translateX(-" + x + "ch)";
            g.DOM.picker1.style[g.DOM.transform] = "translateZ(0) translateX(" + x + "px)";
        }
        if (y !== undefined) {
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
            webglInput.disabled = true;
            webglInput.value    = "Rendering…";
            var offset = parseInt(g.DOM.mat.options[g.DOM.mat.selectedIndex].dataset.offset);
            g.DOM.red.disabled   = false;
            g.DOM.green.disabled = false;
            g.DOM.blue.disabled  = false;
            var nucleicMatrix = false;
            var seq1 = g.DOM.opt1.options[g.DOM.opt1.selectedIndex],
                seq2 = g.DOM.opt2.options[g.DOM.opt2.selectedIndex];
            if (seq1.dataset.type === seq2.dataset.type) {
                if (seq1.dataset.type === "nucleic") {
                    nucleicMatrix = true;
                } else {
                    g.DOM.red.disabled   = true;
                    g.DOM.green.disabled = true;
                    g.DOM.blue.disabled  = true;
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
                nucleicMatrix: nucleicMatrix,
                offset: offset
            });
        }, false);
        webglInput.disabled = false;
    });
};
