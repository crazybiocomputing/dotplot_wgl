/** @license
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

/*exported ViewManager*/
/** @constructor */
function ViewManager() {
    var histData  = {},
        shaders   = {},
        pickX, pickY,
        picked = [],
        gl, prog;
    /**
     * Flag informing if a view is currently being rendered
     * @type {boolean}
     */
    this.rendering = false;

    ["DotPlot.vs", "NucleicNucleic.fs", "NucleicProteic.fs", "ProteicNucleic.fs", "ProteicProteic.fs"].forEach(function(shaderFile) {
        g.xhr2("shaders/" + shaderFile, function(r) {
            shaders[shaderFile.split(".")[0]] = r;
        });
    });

    /**
     * Prepares and loads shaders for a sequence specific dotplot
     * @param {string} fragment - name of the fragment to use for the dotplot
     */
    var prepareShaders = function(fragment) {
        var vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, shaders.DotPlot);
        gl.compileShader(vert);
        gl.attachShader(prog, vert);
        var frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, shaders[fragment]);
        gl.compileShader(frag);
        gl.attachShader(prog, frag);
    };

    /**
     * Renders a WebGL view of the dotplot defined in the parameters
     * @param {Object} seq1 - first sequence
     * @param {string} seq1.type - sequence type
     * @param {number} seq1.key - sequence internal identifier
     * @param {string} seq1.name - sequence name
     * @param {number} seq1.size - sequence length
     * @param {Object} seq2 - second sequence
     * @param {string} seq2.type - sequence type
     * @param {number} seq2.key - sequence internal identifier
     * @param {string} seq2.name - sequence name
     * @param {number} seq2.size - sequence length
     * @param {number} compType - comparison type (0: prot-prot, 1: prot-nuc, 2: nuc-nuc, 3: nuc-prot)
     */
    this.render = function(seq1, seq2, compType) {
        //reninit inputs and canvas when new render calculation
        g.DOM.range1.value = 255;
        g.DOM.range2.value = 0;
        g.DOM.red.checked = g.DOM.green.checked = g.DOM.blue.checked = true;
        g.DOM.hist.style.background = "linear-gradient(to right, #000 0, #000 0%, #fff 100%, #fff 100%)";
        g.DOM.slider1.value = 0;
        g.DOM.slider2.value = 0;
        var wS = g.DOM.windowSize.getValue(),
            w, h;
        if (compType % 2) {
            if (compType === 3) {
                w = Math.floor(seq1.size / 3);
                h = seq2.size;
            } else {
                w = seq1.size;
                h = Math.floor(seq2.size / 3);
            }
        } else {
            w = seq1.size;
            h = seq2.size;
        }
        g.$("window-viewer").style.width = wS + "ch";
        g.DOM.canvas.width         = w;
        g.DOM.canvas.height        = h;
        g.DOM.canvas.style.width   = w + "px";
        g.DOM.canvas.style.height  = h + "px";
        g.DOM.picker1.style.height = (h + 1 - wS) + "px";
        g.DOM.picker2.style.width  = (w + 1 - wS) + "px";

        //creates and initialize new context
        gl = g.context = g.DOM.canvas.getContext(
            "webgl", {alpha: false, preserveDrawingBuffer: true}
        ) || g.DOM.canvas.getContext(
            "experimental-webgl", {alpha: false, preserveDrawingBuffer: true}
        );
        gl.viewport(0, 0, w, h);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        //new program
        prog = g.program = gl.createProgram();

        switch (compType) {
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

        //link buffers and uniforms
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

        gl.uniform2f(
            gl.getUniformLocation(prog, "uOffset"),
            parseFloat(g.DOM.mat.options[g.DOM.mat.selectedIndex].dataset.offset0),
            parseFloat(g.DOM.mat.options[g.DOM.mat.selectedIndex].dataset.offset1)
        );

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

        //weight matrix texture
        var texWidth = (compType === 2) ? 16 : 24,
            tex      = g.matMgr.getTexture(compType);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, texWidth, tex.length / texWidth, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        //sequence textures
        var texLoaded = false;
        g.seqMgr.get(seq1.key, compType === 2, function(seq) {
            g.DOM.slider1.max    = w - 2;
            g.DOM.pickDiv1       = document.createElement("div");
            g.DOM.pickDiv1.title = seq1.name;
            fillDivs(seq.string, compType, "1");
            g.DOM.pick.replaceChild(g.DOM.pickDiv1, g.DOM.pick.children[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            if (seq1.type === "nucleic") {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, seq.typedArray);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, seq.typedArray);
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

        g.seqMgr.get(seq2.key, compType === 2, function(seq) {
            g.DOM.slider2.max    = h - 2;
            g.DOM.pickDiv2       = document.createElement("div");
            g.DOM.pickDiv2.title = seq2.name;
            fillDivs(seq.string, compType, "2");
            g.DOM.pick.replaceChild(g.DOM.pickDiv2, g.DOM.pick.children[1]);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            if (seq2.type === "nucleic") {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, h, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, seq.typedArray);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, h, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, seq.typedArray);
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

    /**
     * Recursively builds a group of 200 spans (max) from a sequence string and inserts it to the DOM
     * @param {string} string - sequence string to be parsed
     * @param {Object} div - DOM element to fill
     * @param {number} index - starting point of the sequence parsing
     */
    var divBuilder = function(string, div, index) {
        var frag = document.createDocumentFragment(),
            i    = 0;
        while (i < 200 && (index + i) < string.length) {
            var span = document.createElement("span");
            span.textContent = string.charAt(index + i);
            frag.appendChild(span);
            i++;
        }
        div.appendChild(frag);
        if ((index + i) < string.length) {
            setTimeout(divBuilder, 50, string, div, index + 200);
        }
    };

    /**
     * Builds a container for a sequence's letters
     * @param {string} string - sequence string to be parsed
     * @param {Object} div - DOM element to fill
     * @param {number} index - starting point of the sequence parsing
     */
    var fillDivs = function(string, compType, num) {
        var div = g.DOM["pickDiv" + num];
        div.classList.add("picking-sequences");
        switch (compType + num) {
            case "22":
                var innerDiv = document.createElement("div");
                div.appendChild(innerDiv);
                divBuilder(string[0], innerDiv, 0);
                break;
            case "12":
            case "21":
            case "31":
                string.forEach(function(string) {
                    var innerDiv = document.createElement("div");
                    div.appendChild(innerDiv);
                    divBuilder(string, innerDiv, 0);
                });
                break;
            default:
                var innerDiv = document.createElement("div");
                div.appendChild(innerDiv);
                divBuilder(string, innerDiv, 0);
        }
    };

    /**
     * Computes the dotplot's pixels for the histogram
     */
    var renderHist = function() {
        var w = new Worker("core/workers/histogram.js");
        w.addEventListener("message", function(message) {
            Object.keys(message.data).forEach(function(key) {
                histData[key] = message.data[key];
            });
            g.DOM.countHist("RGB");
        }, false);
        var wS = g.DOM.windowSize.getValue(),
            pixels = new Uint8Array((g.DOM.canvas.width + 1 - wS) * (g.DOM.canvas.height + 1 - wS) * 4);
        gl.readPixels(wS, wS, g.DOM.canvas.width - wS * 2, g.DOM.canvas.height + 1 - wS *2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        if (g.transf) {
            w.postMessage({
                pixels: pixels,
                transf: g.transf
            }, [pixels.buffer]);
        } else {
            w.postMessage({
                pixels: pixels,
                transf: g.transf
            });
        }
    };

    /**
     * requestAnimationFrame polyfill
     * @method
     * @param {function} callback - function called at next monitor refresh
     * @param {number} [delay] - delay to use in case requestAnimationFrame is not supported
     */
    var rAF = window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              setTimeout;

    var windowViewer;
    /**
     * Draws the WebGL visualization of the dotplot
     * @param {boolean} [updateHist] - whether to update the histogram with the rendered data or not
     */
    this.draw = function(updateHist) {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (updateHist) {
            renderHist();
            g.viewMgr.pick({x: 0, y: 0});
        }
        windowViewer.style.width = g.DOM.windowSize.getValue() * 2 + 1 + "ch";
        rAF(function() {
            g.viewMgr.rendering = false;
        }, 16);
    };

    /**
     * Modifies the histogram with the current pixel counts
     * @param {string} channels - channels to represent in the histogram
     */
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

    /**
     * Displays the sequences at the position picked
     * @param {Object} params - parameters of the picking
     * @param {number} [params.x] - absolute x coordinate on the dotplot
     * @param {number} [params.y] - absolute y coordinate on the dotplot
     * @param {number} [params.dx] - relative x coordinate on the dotplot
     * @param {number} [params.dy] - relative y coordinate on the dotplot
     */
    this.pick = function(params) {
        var modifiedX = false,
            modifiedY = false;
        if ((params.x || params.x === 0) && params.x < g.DOM.canvas.width && params.x !== pickX) {
            pickX = params.x;
            modifiedX = true;
        }
        if (params.dx && params.dx + pickX < g.DOM.canvas.width) {
            pickX += params.dx;
            modifiedX = true;
        }
        if (modifiedX) {
            g.DOM.slider1.value = pickX;
            g.DOM.pickDiv1.style[g.DOM.transform] = "translateZ(0) translateX(-" + pickX + "ch)";
            g.DOM.picker1.style[g.DOM.transform] = "translateZ(0) translateX(" + pickX + "px)";
        }
        if ((params.y || params.y === 0) && params.y < g.DOM.canvas.height && params.y !== pickY) {
            pickY = params.y;
            modifiedY = true;
        }
        if (params.dy && params.dy + pickY < g.DOM.canvas.height) {
            pickY += params.dy;
            modifiedY = true;
        }
        if (modifiedY) {
            g.DOM.slider1.value = pickX;
            g.DOM.pickDiv2.style[g.DOM.transform] = "translateZ(0) translateX(-" + pickY + "ch)";
            g.DOM.picker2.style[g.DOM.transform] = "translateZ(0) translateY(" + pickY + "px)";
        }
        if (modifiedX || modifiedY) {
            var pixel = new Uint8Array(4);
            gl.readPixels(pickX, g.DOM.canvas.height - pickY - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            picked.forEach(function(span) {
                span.style.background = span.style.textShadow = "";
            });
            picked = [];
            var cont = (g.DOM.pickDiv2.childElementCount === 3) ? g.DOM.pickDiv2 : g.DOM.pickDiv1;
            var pX = (g.DOM.pickDiv2.childElementCount === 3) ? pickY : pickX;
            Array.prototype.forEach.call(cont.children, function(div) {
                var span = div.children[pX];
                span.style.textShadow = "1px 1px white";
                picked.push(span);
            });
            if (picked.length === 1) {
                picked[0].style.background = "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
            } else {
                picked[0].style.background = "rgb(" + pixel[0] + ", 0, 0)";
                picked[1].style.background = "rgb(0, " + pixel[1] + ", 0)";
                picked[2].style.background = "rgb(0, 0, " + pixel[2] + ")";
            }
        }
    };

    g.executeAfterDOM(function() {
        var colorDesc = g.$("hist").firstChild;
        //click event on the render button
        g.$("render").addEventListener("click", function() {
            if (!g.viewMgr.rendering) {
                g.viewMgr.rendering = true;
                g.DOM.red.disabled = g.DOM.green.disabled = g.DOM.blue.disabled = false;
                var seq1 = g.DOM.opt1.options[g.DOM.opt1.selectedIndex],
                    seq2 = g.DOM.opt2.options[g.DOM.opt2.selectedIndex],
                    compType;
                if (seq1.dataset.type === seq2.dataset.type) {
                    if (seq2.dataset.type === "nucleic") {
                        compType = 2;
                        colorDesc.textContent = "Nucleic strand:";
                        g.DOM.red.nextElementSibling.textContent   = "forward";
                        g.DOM.green.nextElementSibling.textContent = "reverse";
                        g.DOM.blue.nextElementSibling.textContent  = "reverse comp.";
                    } else {
                        compType = 0;
                        g.DOM.red.disabled = g.DOM.green.disabled = g.DOM.blue.disabled = true;
                        colorDesc.textContent = g.DOM.red.nextElementSibling.textContent = g.DOM.green.nextElementSibling.textContent = g.DOM.blue.nextElementSibling.textContent = "";
                    }
                } else {
                    colorDesc.textContent = "Reading frame offsets:";
                    g.DOM.red.nextElementSibling.textContent   = "0";
                    g.DOM.green.nextElementSibling.textContent = "1";
                    g.DOM.blue.nextElementSibling.textContent  = "2";
                    if (seq2.dataset.type === "nucleic") {
                        compType = 1;
                    } else {
                        compType = 3;
                    }
                }
                g.viewMgr.render(
                    {
                        type: seq1.dataset.type,
                        key:  parseInt(seq1.dataset.key),
                        name: seq1.textContent,
                        size: parseInt(seq1.dataset.size)
                    }, {
                        type: seq2.dataset.type,
                        key:  parseInt(seq2.dataset.key),
                        name: seq2.textContent,
                        size: parseInt(seq2.dataset.size)
                    }, compType
                );
            }
        }, false);
        windowViewer = g.$("window-viewer");
    });
}
