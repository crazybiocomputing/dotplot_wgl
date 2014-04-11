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

//var STRING1 = "MAAPSRTTLMPPPFRLQLRLLILPILLLLRHDAVHAEPYSGGFGSSAVSSGGLGSVGIHIPGGGVGVITEARCPRVCSCTGLNVDCSHRGLTSVPRKISADVERLELQGNNLTVIYETDFQRLTKLRMLQLTDNQIHTIERNSFQDLVSLERLDISNNVITTVGRRVFKGAQSLRSLQLDNNQITCLDEHAFKGLVELEILTLNNNNLTSLPHNIFGGLGRLRALRLSDNPFACDCHLSWLSRFLRSATRLAPYTRCQSPSQLKGQNVADLHDQEFKCSGLTEHAPMECGAENSCPHPCRCADGIVDCREKSLTSVPVTLPDDTTDVRLEQNFITELPPKSFSSFRRLRRIDLSNNNISRIAHDALSGLKQLTTLVLYGNKIKDLPSGVFKGLGSLRLLLLNANEISCIRKDAFRDLHSLSLLSLYDNNIQSLANGTFDAMKSMKTVHLAKNPFICDCNLRWLADYLHKNPIETSGARCESPKRMHRRRIESLREEKFKCSWGELRMKLSGECRMDSDCPAMCHCEGTTVDCTGRRLKEIPRDIPLHTTELLLNDNELGRISSDGLFGRLPHLVKLELKRNQLTGIEPNAFEGASHIQELQLGENKIKEISNKMFLGLHQLKTLNLYDNQISCVMPGSFEHLNSLTSLNLASNPFNCNCHLAWFAECVRKKSLNGGAARCGAPSKVRDVQIKDLPHSEFKCSSENSEGCLGDGYCPPSCTCTGTVVACSRNQLKEIPRGIPAETSELYLESNEIEQIHYERIRHLRSLTRLDLSNNQITILSNYTFANLTKLSTLIISYNKLQCLQRHALSGLNNLRVVSLHGNRISMLPEGSFEDLKSLTHIALGSNPLYCDCGLKWFSDWIKLDYVEPGIARCAEPEQMKDKLILSTPSSSFVCRGRVRNDILAKCNACFEQPCQNQAQCVALPQREYQCLCQPGYHGKHCEFMIDACYGNPCRNNATCTVLEEGRFSCQCAPGYTGARCETNIDDCLGEIKCQNNATCIDGVESYKCECQPGFSGEFCDTKIQFCSPEFNPCANGAKCMDHFTHYSCDCQAGFHGTNCTDNIDDCQNHMCQNGGTCVDGINDYQCRCPDDYTGKYCEGHNMISMMYPQTSPCQNHECKHGVCFQPNAQGSDYLCRCHPGYTGKWCEYLTSISFVHNNSFVELEPLRTRPEANVTIVFSSAEQNGILMYDGQDAHLAVELFNGRIRVSYDVGNHPVSTMYSFEMVADGKYHAVELLAIKKNFTLRVDRGLARSIINEGSNDYLKLTTPMFLGGLPVDPAQQAYKNWQIRNLTSFKGCMKEVWINHKLVDFGNAQRQQKITPGCALLEGEQQEEEDDEQDFMDETPHIKEEPVDPCLENKCRRGSRCVPNSNARDGYQCKCKHGQRGRYCDQGEGSTEPPTVTAASTCRKEQVREYYTENDCRSRQPLKYAKCVGGCGNQCCAAKIVRRRKVRMVCSNNRKYIKNLDIVRKCGCTKKCYY";
var STRING1 = "ABCDCBDCCDBDBCAABCBCAABAABCDCADCADDABBACDABADDCADABBADAC";
STRING1 += STRING1 + STRING1 + STRING1;
var STRING2 = STRING1 + STRING1;

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

//Identity matrix
var matrix = new Uint8Array(5 * 5 * 4);
matrix[0] = 255;
matrix[24] = 255;
matrix[48] = 255;
matrix[72] = 255;
matrix[96] = 255;

console.timeEnd("load");

var webgl = function(canvas, shaders) {
    var w = STRING1.length;
    console.time("1");

    var WINDOW_SIZE = Math.floor(g.$("window").value);
    console.log("sequence 1: " + w);
    console.log("sequence 2: " + h);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    var gl = canvas.getContext(
        "webgl", {alpha: false, preserveDrawingBuffer: true}
    ) || canvas.getContext(
        "experimental-webgl", {alpha: false, preserveDrawingBuffer: true}
    );
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var program = gl.createProgram();

    for (var i = 0; i < shaders.length; i++) {
        var sh = gl.createShader(i % 2 === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(sh, shaders[i]);
        gl.compileShader(sh);
        gl.attachShader(program, sh);
    }

    gl.linkProgram(program);
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1,  1,  1,  1,  1, -1,
        -1,  1,  1, -1, -1, -1
    ]), gl.STATIC_DRAW);
    program.vertexPosAttrib = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPosArray);
    gl.vertexAttribPointer(program.vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

    program.umat = gl.getUniformLocation(program, "uSamplerMat");
    gl.uniform1i(program.umat, 0);
    program.utex1 = gl.getUniformLocation(program, "uSampler1");
    gl.uniform1i(program.utex1, 1);
    program.utex2 = gl.getUniformLocation(program, "uSampler2");
    gl.uniform1i(program.utex2, 2);

    program.sizesUniform = gl.getUniformLocation(program, "uSizes");
    gl.uniform2f(program.sizesUniform, w, h);

    program.windowUniform = gl.getUniformLocation(program, "uWindow");
    gl.uniform1i(program.windowUniform, WINDOW_SIZE);

    var texCoordLocation = gl.getAttribLocation(program, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    var mat = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mat);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 5, 5, 0, gl.RGBA, gl.UNSIGNED_BYTE, matrix);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    var tex1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    var tex2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, h, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //data for the histogram
    var hist = new Uint8Array((w + 1 - WINDOW_SIZE) * (h + 1 - WINDOW_SIZE) * 4);
    gl.readPixels(0, 0, (w + 1 - WINDOW_SIZE), (h + 1 - WINDOW_SIZE), gl.RGBA, gl.UNSIGNED_BYTE, hist);

    var w = new Worker("/scripts/workers/histogram.js");
    w.addEventListener("message", function(message) {
        console.log(message.data);
    }, false);
    w.postMessage({pixels: hist});
    
    var webglInput = g.$("webgl");
    webglInput.value = "Render WebGL graph";
    webglInput.disabled = false;

    console.timeEnd("1");
};

var doWhenDOMHasLoaded = function() {
    var canvas = g.$("canvas");

    g.loadShaders(["dotplot.vertex.shader", "DNADNA.fragment.shader"], function(shaders) {
        var webglInput = g.$("webgl");
        webglInput.addEventListener("click", function(e) {
            e.preventDefault();
            webglInput.disabled = true;
            webglInput.value = "Rendering…";
            webgl(canvas, shaders);
        }, false);
        webglInput.disabled = false;
    });
};

if (g.DOMLoaded) {
    doWhenDOMHasLoaded();
} else {
    window.addEventListener("DOMContentLoaded", doWhenDOMHasLoaded, false);
}
