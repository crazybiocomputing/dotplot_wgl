/* jshint worker: true */

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
    for (var i = 0; i < pixels.length; i+=3){
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
    }, [
        histCountR.buffer,
        histCountG.buffer,
        histCountB.buffer,
        histLogR.buffer,
        histLogG.buffer,
        histLogB.buffer
    ]);
    self.close();
}, false);
