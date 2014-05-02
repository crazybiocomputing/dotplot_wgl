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


//maxCount corresponds to a list of the values in each color channel(s) for long sequences
//maxCount corresponds to a list of the values in each color channel(s) for short sequences
var maxCount = {RGB: null, RG: null, GB: null, RB: null, R: null, G: null, B: null},
    maxLog   = {RGB: null, RG: null, GB: null, RB: null, R: null, G: null, B: null},
    histCount = {
        RGB: new Uint32Array(256),
        RG:  new Uint32Array(256),
        GB:  new Uint32Array(256),
        RB:  new Uint32Array(256),
        R:   new Uint32Array(256),
        G:   new Uint32Array(256),
        B:   new Uint32Array(256)
    },
    histLog = {
        RGB: new Uint8Array(256),
        RG:  new Uint8Array(256),
        GB:  new Uint8Array(256),
        RB:  new Uint8Array(256),
        R:   new Uint8Array(256),
        G:   new Uint8Array(256),
        B:   new Uint8Array(256)
    };

self.addEventListener("message", function(message) {
    var pixels = message.data.pixels;
    for (var i = 0; i < pixels.length; i+=4){
        histCount.R[pixels[i]]++;
        histCount.G[pixels[i+1]]++;
        histCount.B[pixels[i+2]]++;
    }
    for (var i = 0; i < 256; i++){
        histCount.RG[i]  = histCount.R[i] + histCount.G[i];
        histCount.GB[i]  = histCount.G[i] + histCount.B[i];
        histCount.RB[i]  = histCount.R[i] + histCount.B[i];
        histCount.RGB[i] = histCount.RG[i] + histCount.B[i];
        histLog.R[i]     = Math.log(histCount.R[i]);
        histLog.G[i]     = Math.log(histCount.G[i]);
        histLog.B[i]     = Math.log(histCount.B[i]);
        histLog.RG[i]    = Math.log(histCount.RG[i]);
        histLog.GB[i]    = Math.log(histCount.GB[i]);
        histLog.RB[i]    = Math.log(histCount.RB[i]);
        histLog.RGB[i]   = Math.log(histCount.RGB[i]);
        maxCount.RGB     = Math.max(maxCount.RGB, histCount.RGB[i]);
        maxCount.RG      = Math.max(maxCount.RG, histCount.RG[i]);
        maxCount.GB      = Math.max(maxCount.GB, histCount.GB[i]);
        maxCount.RB      = Math.max(maxCount.RB, histCount.RB[i]);
        maxCount.R       = Math.max(maxCount.R, histCount.R[i]);
        maxCount.G       = Math.max(maxCount.G, histCount.G[i]);
        maxCount.B       = Math.max(maxCount.B, histCount.B[i]);
        maxLog.RGB       = Math.max(maxLog.RGB, histLog.RGB[i]);
        maxLog.RG        = Math.max(maxLog.RG, histLog.RG[i]);
        maxLog.GB        = Math.max(maxLog.GB, histLog.GB[i]);
        maxLog.RB        = Math.max(maxLog.RB, histLog.RB[i]);
        maxLog.R         = Math.max(maxLog.R, histLog.R[i]);
        maxLog.G         = Math.max(maxLog.G, histLog.G[i]);
        maxLog.B         = Math.max(maxLog.B, histLog.B[i]);
    }

    if (!message.data.transf) {
        self.postMessage({
            maxCount:   maxCount,
            maxLog:     maxLog,
            histCount:  histCount,
            histLog:    histLog,
        });
    } else {
        self.postMessage({
            maxCount:   maxCount,
            maxLog:     maxLog,
            histCount:  histCount,
            histLog:    histLog,
        }, [
            histCount.RGB.buffer,
            histCount.RG.buffer,
            histCount.GB.buffer,
            histCount.RB.buffer,
            histCount.R.buffer,
            histCount.G.buffer,
            histCount.B.buffer,
            histLog.RGB.buffer,
            histLog.RG.buffer,
            histLog.GB.buffer,
            histLog.RB.buffer,
            histLog.R.buffer,
            histLog.G.buffer,
            histLog.B.buffer
        ]);
    }
    self.close();
}, false);
