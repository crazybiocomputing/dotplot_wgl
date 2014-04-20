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

/*jshint worker: true*/
/*jshint globalstrict: true*/
"use strict";

var maxCount = {rgb: null, rg: null, gb: null, rb: null, r: null, g: null, b: null};
var maxLog   = {rgb: null, rg: null, gb: null, rb: null, r: null, g: null, b: null};
var histCountR = new Uint32Array(256);
var histCountG = new Uint32Array(256);
var histCountB = new Uint32Array(256);
var histLogR   = new Uint8Array(256);
var histLogG   = new Uint8Array(256);
var histLogB   = new Uint8Array(256);

self.addEventListener("message", function(message) {
    var pixels = message.data.pixels;
    for (var i = 0; i < pixels.length; i+=4){
        histCountR[pixels[i]]++;
        histCountG[pixels[i+1]]++;
        histCountB[pixels[i+2]]++;
    }
    for (var i = 0; i < 256; i++){
        histLogR[i] = Math.log(histCountR[i]);
        histLogG[i] = Math.log(histCountG[i]);
        histLogB[i] = Math.log(histCountB[i]);
        maxCount.rgb= Math.max(maxCount.rgb, histCountR[i] + histCountG[i] + histCountB[i]);
        maxCount.rg = Math.max(maxCount.rg, histCountR[i] + histCountG[i]);
        maxCount.gb = Math.max(maxCount.gb, histCountG[i] + histCountB[i]);
        maxCount.rb = Math.max(maxCount.rb, histCountR[i] + histCountB[i]);
        maxCount.r  = Math.max(maxCount.r, histCountR[i]);
        maxCount.g  = Math.max(maxCount.g, histCountG[i]);
        maxCount.b  = Math.max(maxCount.b, histCountB[i]);
        maxLog.rgb  = Math.max(maxLog.rgb, histLogR[i] + histLogG[i] + histLogB[i]);
        maxLog.rg   = Math.max(maxLog.rg, histLogR[i] + histLogG[i]);
        maxLog.gb   = Math.max(maxLog.gb, histLogG[i] + histLogB[i]);
        maxLog.rb   = Math.max(maxLog.rb, histLogR[i] + histLogB[i]);
        maxLog.r    = Math.max(maxLog.r, histLogR[i]);
        maxLog.g    = Math.max(maxLog.g, histLogG[i]);
        maxLog.b    = Math.max(maxLog.b, histLogB[i]);
    }

    self.postMessage({
        maxCount:   maxCount,
        maxLog:     maxLog,
        histCountR: histCountR,
        histCountG: histCountG,
        histCountB: histCountB,
        histLogR:   histLogR,
        histLogG:   histLogG,
        histLogB:   histLogB,
    }/*, [
        histCountR.buffer,
        histCountG.buffer,
        histCountB.buffer,
        histLogR.buffer,
        histLogG.buffer,
        histLogB.buffer
    ]*/);
    //NOTE: check support for transferable objects
    self.close();
}, false);
