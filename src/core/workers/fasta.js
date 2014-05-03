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
/* if called, create a fasta file of the sequence cleaned */
self.addEventListener("message", function(message) {
    //recognize comments & sequence
    /** 
     * string of the sequence
     * @type {string}
     */
    var string     = message.data.string;
    /** 
     * Comment of the sequence
     * @type {string[]}
     */
    var comments   = message.data.comment.match(/[>;].*/g);
    comments = comments || [];
    var headerSize = comments.length + 1;
    /** 
     * List of each futur line of the sequence with 70 chars max
     * @type {Array[]}
     */
    /*Divide sequence in multiple string of 70 characters*/
    var seq = new Array(headerSize + Math.floor(string.length / 70));
    /** 
     * string of each line
     * @type {string}
     */
     var temp = "";
    //New comment with sequence infos at the beginning
    seq[0] = ">" + message.data.name + "|" + (message.data.nucleic ? "nucleic" : "proteic") + "|length:" + string.length + "\r\n";
    comments.forEach(function(comment, i) {
        //Add each old comments with an index in seq
        seq[i + 1] = comment + "\r\n";
    });
    // Add string of sequence  to the Array with spaces each 10 chars and backslash each 70 chars in order to improve visibility
    for (var i = 0; i < string.length; i += 10) {
        switch (i % 70) {
            case 60://end of line
                seq[headerSize + parseInt(i / 70)] = temp + string.substr(i, 10) + "\r\n";
                temp = "";
                break;
            default:
                temp += string.substr(i, 10) + " ";
                break;
        }
    }
    seq[headerSize + parseInt(i / 70)] = temp + "\r\n\r\n";
    //Once worker is done, return a new file of the sequence, fasta-like
    self.postMessage({
        blob: new Blob(seq, {type: "text/plain"}),
        name: message.data.name.replace(/\s/g, "_")
    });
    self.close();
}, false);
