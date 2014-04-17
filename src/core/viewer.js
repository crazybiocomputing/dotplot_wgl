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

var STRING1 = "MAAPSRTTLMPPPFRLQLRLLILPILLLLRHDAVHAEPYSGGFGSSAVSSGGLGSVGIHIPGGGVGVITEARCPRVCSCTGLNVDCSHRGLTSVPRKISADVERLELQGNNLTVIYETDFQRLTKLRMLQLTDNQIHTIERNSFQDLVSLERLDISNNVITTVGRRVFKGAQSLRSLQLDNNQITCLDEHAFKGLVELEILTLNNNNLTSLPHNIFGGLGRLRALRLSDNPFACDCHLSWLSRFLRSATRLAPYTRCQSPSQLKGQNVADLHDQEFKCSGLTEHAPMECGAENSCPHPCRCADGIVDCREKSLTSVPVTLPDDTTDVRLEQNFITELPPKSFSSFRRLRRIDLSNNNISRIAHDALSGLKQLTTLVLYGNKIKDLPSGVFKGLGSLRLLLLNANEISCIRKDAFRDLHSLSLLSLYDNNIQSLANGTFDAMKSMKTVHLAKNPFICDCNLRWLADYLHKNPIETSGARCESPKRMHRRRIESLREEKFKCSWGELRMKLSGECRMDSDCPAMCHCEGTTVDCTGRRLKEIPRDIPLHTTELLLNDNELGRISSDGLFGRLPHLVKLELKRNQLTGIEPNAFEGASHIQELQLGENKIKEISNKMFLGLHQLKTLNLYDNQISCVMPGSFEHLNSLTSLNLASNPFNCNCHLAWFAECVRKKSLNGGAARCGAPSKVRDVQIKDLPHSEFKCSSENSEGCLGDGYCPPSCTCTGTVVACSRNQLKEIPRGIPAETSELYLESNEIEQIHYERIRHLRSLTRLDLSNNQITILSNYTFANLTKLSTLIISYNKLQCLQRHALSGLNNLRVVSLHGNRISMLPEGSFEDLKSLTHIALGSNPLYCDCGLKWFSDWIKLDYVEPGIARCAEPEQMKDKLILSTPSSSFVCRGRVRNDILAKCNACFEQPCQNQAQCVALPQREYQCLCQPGYHGKHCEFMIDACYGNPCRNNATCTVLEEGRFSCQCAPGYTGARCETNIDDCLGEIKCQNNATCIDGVESYKCECQPGFSGEFCDTKIQFCSPEFNPCANGAKCMDHFTHYSCDCQAGFHGTNCTDNIDDCQNHMCQNGGTCVDGINDYQCRCPDDYTGKYCEGHNMISMMYPQTSPCQNHECKHGVCFQPNAQGSDYLCRCHPGYTGKWCEYLTSISFVHNNSFVELEPLRTRPEANVTIVFSSAEQNGILMYDGQDAHLAVELFNGRIRVSYDVGNHPVSTMYSFEMVADGKYHAVELLAIKKNFTLRVDRGLARSIINEGSNDYLKLTTPMFLGGLPVDPAQQAYKNWQIRNLTSFKGCMKEVWINHKLVDFGNAQRQQKITPGCALLEGEQQEEEDDEQDFMDETPHIKEEPVDPCLENKCRRGSRCVPNSNARDGYQCKCKHGQRGRYCDQGEGSTEPPTVTAASTCRKEQVREYYTENDCRSRQPLKYAKCVGGCGNQCCAAKIVRRRKVRMVCSNNRKYIKNLDIVRKCGCTKKCYY";
//var STRING1 = "ABCDABCDDCBADCBAAAAAAA";
var STRING2 = STRING1;// + STRING1;

var w = STRING1.length,
    h = STRING2.length;

console.time("load");
var texture1 = new Uint8Array(w);
var texture2 = new Uint8Array(h);
for (var i = 0; i < texture1.length; i++) {
    texture1[i] = (STRING1.charCodeAt(i) - 65) * (255 / 5);
}
for (var i = 0; i < texture2.length; i++) {
    texture2[i] = (STRING2.charCodeAt(i) - 65) * (255 / 5);
}

console.timeEnd("load");

var webgl = function(params) {
    console.time("1");

    g.DOM.reinitHist();

    console.log("sequence 1: " + w);
    console.log("sequence 2: " + h);
    g.DOM.canvas.width = w;
    g.DOM.canvas.height = h;
    g.DOM.canvas.style.width = w + "px";
    g.DOM.canvas.style.height = h + "px";
    g.context = g.DOM.canvas.getContext(
        "webgl", {alpha: false, preserveDrawingBuffer: true}
    ) || g.DOM.canvas.getContext(
        "experimental-webgl", {alpha: false, preserveDrawingBuffer: true}
    );

    g.context.clearColor(1.0, 1.0, 1.0, 1.0);
    g.context.clear(g.context.COLOR_BUFFER_BIT|g.context.DEPTH_BUFFER_BIT);
    g.program = g.context.createProgram();

    var vertex = g.context.createShader(g.context.VERTEX_SHADER);
    g.context.shaderSource(vertex, params.vertex);
    g.context.compileShader(vertex);
    g.context.attachShader(g.program, vertex);
    var fragment = g.context.createShader(g.context.FRAGMENT_SHADER);
    g.context.shaderSource(fragment, params.fragment);
    g.context.compileShader(fragment);
    g.context.attachShader(g.program, fragment);

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
    
    var tex = params.nucleicMatrix ? g.nucleicTex : g.proteicTex;
    var texWidth = params.nucleicMatrix ? 16 : 24;
    g.program.sizesUniform = g.context.getUniformLocation(g.program, "uOffset");
    g.context.uniform1f(g.program.sizesUniform, params.offset / (tex.length / texWidth));
    g.program.sizesUniform = g.context.getUniformLocation(g.program, "uOffsetNext");
    g.context.uniform1f(g.program.sizesUniform, (params.offset + texWidth) / (tex.length / texWidth));

    g.program.windowUniform = g.context.getUniformLocation(g.program, "uWindow");
    g.context.uniform1i(g.program.windowUniform, g.DOM.windowSize.getValue());

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

    var tex1 = g.context.createTexture();
    g.context.activeTexture(g.context.TEXTURE1);
    g.context.bindTexture(g.context.TEXTURE_2D, tex1);
    g.context.texImage2D(g.context.TEXTURE_2D, 0, g.context.LUMINANCE, w, 1, 0, g.context.LUMINANCE, g.context.UNSIGNED_BYTE, texture1);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_S, g.context.CLAMP_TO_EDGE);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_T, g.context.CLAMP_TO_EDGE);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MAG_FILTER, g.context.NEAREST);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MIN_FILTER, g.context.NEAREST);

    var tex2 = g.context.createTexture();
    g.context.activeTexture(g.context.TEXTURE2);
    g.context.bindTexture(g.context.TEXTURE_2D, tex2);
    g.context.texImage2D(g.context.TEXTURE_2D, 0, g.context.LUMINANCE, h, 1, 0, g.context.LUMINANCE, g.context.UNSIGNED_BYTE, texture2);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_S, g.context.CLAMP_TO_EDGE);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_WRAP_T, g.context.CLAMP_TO_EDGE);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MAG_FILTER, g.context.NEAREST);
    g.context.texParameteri(g.context.TEXTURE_2D, g.context.TEXTURE_MIN_FILTER, g.context.NEAREST);

    g.context.drawArrays(g.context.TRIANGLES, 0, 6);

    g.renderHist();

    var webglInput = g.$("webgl");
    webglInput.value = "Render WebGL graph";
    webglInput.disabled = false;

    console.timeEnd("1");
};

g.renderHist = function() {
    //FIXME problem with window size (white pixels)
    var wS = g.DOM.windowSize.getValue();
    var pixels = new Uint8Array((g.DOM.canvas.width + 1 - wS) * (g.DOM.canvas.height + 1 - wS) * 4);
    g.context.readPixels(0, 0, g.DOM.canvas.width + 1 - wS, g.DOM.canvas.height + 1 - wS, g.context.RGBA, g.context.UNSIGNED_BYTE, pixels);
    console.log(pixels);
    console.log(pixels[0]);
    console.log(pixels[1]);
    console.log(pixels[2]);
    console.log(pixels[3]);
    console.log(pixels[4]);

    var w = new Worker("core/workers/histogram.js");
    w.addEventListener("message", function(message) {
        console.log(message.data);
        for (var i = 0; i < 256; i++) {
            g.DOM.hist.children[i * 2].style[g.DOM.transform] = "translate3d(0, -" + (message.data.histCountR[i] / message.data.maxCount.r * 200) + "px, 0)";
            g.DOM.hist.children[i * 2 + 1].style[g.DOM.transform] = "translate3d(0, -" + (message.data.histLogR[i] / message.data.maxLog.r * 200) + "px, 0)";
        }
    }, false);
    w.postMessage({pixels: pixels});
};

var initWebGL = function() {
    g.loadShaders(["DotPlot.vs", "NucleicNucleic.fs", "NucleicProteic.fs", "ProteicProteic.fs"], function(shaders) {
        var webglInput = g.$("webgl");
        webglInput.addEventListener("click", function() {
            webglInput.disabled = true;
            webglInput.value = "Rendering…";
            var offset = parseInt(g.DOM.mat.options[g.DOM.mat.selectedIndex].dataset.offset);
            g.DOM.red.disabled = false;
            g.DOM.green.disabled = false;
            g.DOM.blue.disabled = false;
            if (g.DOM.opt1.options[g.DOM.opt1.selectedIndex].dataset.type === g.DOM.opt2.options[g.DOM.opt2.selectedIndex].dataset.type) {
                if (g.DOM.opt1.options[g.DOM.opt1.selectedIndex].dataset.type === "nucleic") {
                    webgl({vertex: shaders[0], fragment: shaders[1], nucleicMatrix: true, offset: offset});
                } else {
                    g.DOM.red.disabled = true;
                    g.DOM.green.disabled = true;
                    g.DOM.blue.disabled = true;
                    webgl({vertex: shaders[0], fragment: shaders[3], nucleicMatrix: false, offset: offset});
                }
            } else {
                webgl({vertex: shaders[0], fragment: shaders[2], nucleicMatrix: false, offset: offset});
            }
        }, false);
        webglInput.disabled = false;
    });
};

if (g.DOMLoaded) {
    initWebGL();
} else {
    document.addEventListener("DOMContentLoaded", initWebGL, false);
}
