/*
 *
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
 *
 *
 */

//miscellaneous functions to be used across the whole application
"use strict";

/*exported $*/
//shortcut for getElementById
function $(id) {
    return document.getElementById(id);
}

//makes async requests
function xhr2(url, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "text";
    req.onload = function() {
        if (this.status === 200) {
            callback(this.response);
        }
    };
    req.send();
}

/*exported loadShaders*/
//loads shaders from the server
function loadShaders (shaders, callback) {
    var responses = [];
    var aggregateResponses = function(shaderText) {
        responses.push(shaderText);
        if (responses.length === shaders.length) {
            callback(responses);
        }
    };
    for (var i = 0; i < shaders.length; i++) {
        xhr2("shaders/" + shaders[i], aggregateResponses);
    }
}

