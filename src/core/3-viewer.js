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
    g.viewMgr.window   = 1;
    g.viewMgr.red      = true;
    g.viewMgr.green    = true;
    g.viewMgr.blue     = true;
    g.viewMgr.histData = {};
    g.viewMgr.tex      = {
        type:   null
    };

    g.viewMgr.draw = function(updateHist) {
        g.context.drawArrays(g.context.TRIANGLES, 0, 6);
        if (updateHist) {
            g.DOM.renderHist();
        }
        g.viewMgr.pick(0, 0);
        var webglInput      = g.$("webgl");
        webglInput.value    = "Render WebGL graph";
        webglInput.disabled = false;
        console.timeEnd("1");
    };

    g.viewMgr.render = function(params) {
        console.time("1");
        g.DOM.reinitCont();
        var w = params.seq1.size,
            h = params.seq2.size,
            wS = g.DOM.windowSize.getValue();
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

        var vert = g.context.createShader(g.context.VERTEX_SHADER);
        g.context.shaderSource(vert, this.vertex);
        g.context.compileShader(vert);
        g.context.attachShader(g.program, vert);

        var frag = g.context.createShader(g.context.FRAGMENT_SHADER);
        if (params.nucleicMatrix) {
            g.context.shaderSource(frag, this.frag1);
        } else {
            if (params.seq1.type === params.seq2.type) {
                g.context.shaderSource(frag, this.frag3);
            } else {
                g.context.shaderSource(frag, this.frag2);
            }
        }
        g.context.compileShader(frag);
        g.context.attachShader(g.program, frag);

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

        this.tex.type = (params.seq1.type === "proteic" || params.seq2.type === "proteic" ) ? "proteic" : "nucleic";

        var tex = params.nucleicMatrix ? g.nucleicTex : g.proteicTex;
        var texWidth = params.nucleicMatrix ? 16 : 24;
        g.program.sizesUniform = g.context.getUniformLocation(g.program, "uOffset");
        g.context.uniform1f(g.program.sizesUniform, params.offset / (tex.length / texWidth));
        g.program.sizesUniform = g.context.getUniformLocation(g.program, "uOffsetNext");
        g.context.uniform1f(g.program.sizesUniform, (params.offset + texWidth) / (tex.length / texWidth));

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uWindow");
        g.context.uniform1i(g.program.windowUniform, wS);

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uMax");
        g.context.uniform1f(g.program.windowUniform, 1.0);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uMin");
        g.context.uniform1f(g.program.windowUniform, 0.0);

        g.program.windowUniform = g.context.getUniformLocation(g.program, "uRed");
        g.context.uniform1i(g.program.windowUniform, 1);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uGreen");
        g.context.uniform1i(g.program.windowUniform, 1);
        g.program.windowUniform = g.context.getUniformLocation(g.program, "uBlue");
        g.context.uniform1i(g.program.windowUniform, 1);

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
        g.seqMgr.getTex(params.seq1.key, this.tex.type, function(texture, string) {
            g.DOM.slider1.max = texture.length - wS;
            g.DOM.pickDiv1 = document.createElement("div");
            for (var i = 0; i < string.length; i++) {
                var temp = document.createElement("span");
                temp.textContent = string.charAt(i);
                g.DOM.pickDiv1.appendChild(temp);
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

        g.seqMgr.getTex(params.seq2.key, this.tex.type, function(texture, string) {
            g.DOM.slider2.max = texture.length - wS;
            g.DOM.pickDiv2 = document.createElement("div");
            for (var i = 0; i < string.length; i++) {
                var temp = document.createElement("span");
                temp.textContent = string.charAt(i);
                g.DOM.pickDiv2.appendChild(temp);
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

    g.DOM.countHist = function(channels) {
        for (var i = 0; i < 256; i++) {
            g.DOM.hist.children[i * 2].style[g.DOM.transform] = "translate3d(0, -" + ((channels ? (g.viewMgr.histData.histCount[channels][i] / g.viewMgr.histData.maxCount[channels]) : 0) * 200) + "px, 0)";
            g.DOM.hist.children[i * 2 + 1].style[g.DOM.transform] = "translate3d(0, -" + ((channels ? (g.viewMgr.histData.histLog[channels][i] / g.viewMgr.histData.maxLog[channels]) : 0) * 200) + "px, 0)";
        }
        if (!channels) {//all black
            g.DOM.hist.children[0].style[g.DOM.transform] = "translate3d(0, -200px, 0)";
            g.DOM.hist.children[1].style[g.DOM.transform] = "translate3d(0, -200px, 0)";
        }
    };

    g.DOM.renderHist = function() {
        var w = new Worker("core/workers/histogram.js");
        w.addEventListener("message", function(message) {
            if (typeof message.data.byteLength === "undefined") {
                Object.keys(message.data).forEach(function(key) {
                    g.viewMgr.histData[key] = message.data[key];
                });
                g.DOM.countHist("RGB");
            }
        }, false);
        var wS = g.DOM.windowSize.getValue();
        //FIXME problem with window size (white pixels)
        var pixels = new Uint8Array((g.DOM.canvas.width + 1 - wS) * (g.DOM.canvas.height + 1 - wS) * 4);
        g.context.readPixels(0, 0, g.DOM.canvas.width + 1 - wS, g.DOM.canvas.height + 1 - wS, g.context.RGBA, g.context.UNSIGNED_BYTE, pixels);
        w.postMessage({pixels: pixels});
    };

    g.viewMgr.pick = function(x, y) {
        console.log(x + " " + y);
    };

    var loadShaders = function(shaders, callback) {
        var responses = shaders.map(function() {return null});
        var aggregateResponses = function(shaderText, i) {
            responses[i] = shaderText;
            if (responses.every(function(r){return r !== null})) {
                callback(responses);
            }
        };
        shaders.forEach(function(shader, i) {
            g.xhr2("shaders/" + shader, "text", aggregateResponses, i);
        });
    };
    loadShaders(["DotPlot.vs", "NucleicNucleic.fs", "NucleicProteic.fs", "ProteicProteic.fs"], function(shaders) {
        g.viewMgr.vertex = shaders[0];
        g.viewMgr.frag1  = shaders[1];
        g.viewMgr.frag2  = shaders[2];
        g.viewMgr.frag3  = shaders[3];
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
                g.viewMgr.render({
                    seq1: {
                        type: seq1.dataset.type,
                        key:  seq1.dataset.key,
                        size: parseInt(seq1.dataset.size)
                    },
                    seq2: {
                        type: seq2.dataset.type,
                        key:  seq2.dataset.key,
                        size: parseInt(seq2.dataset.size)
                    },
                    nucleicMatrix: nucleicMatrix,
                    offset: offset
                });
            }, false);
            webglInput.disabled = false;
        });
    });
};
