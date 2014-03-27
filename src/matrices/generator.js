/* jshint node:    true */
/* global require: true */

//Use nodejs
//Generates unified texture files from score files
//Scores should match this regular expression: /-?\d+(\.\d+)?/

"use strict";
var fs = require("fs");

var dnaMatrices = [];
var proteinMatrices = [];

fs.readdirSync(".").forEach(function(fileName) {
    if (fileName.match(/^.*\.dna\.csv$/i)) {
        dnaMatrices.push(fileName);
    } else if (fileName.match(/^.*\.protein\.csv$/i))  {
        proteinMatrices.push(fileName);
    }
});

var bufferize = function(array, size) {
    var buffer = new Buffer(array.length * size);
    for (var i = 0; i < buffer.length; i++) {
        buffer.writeUInt8(0, i);
    }
    array.forEach(function(matrixFile, indexFile) {
        var read = fs.readFileSync(matrixFile, "utf8");
        var scores = read.split(/[^\d.-]+/);
        scores = scores.filter(function(score) {
            return score !== "";
        });
        var minValue = Math.min.apply(null, scores);
        var amplitude = Math.max.apply(null, scores) - minValue;
        scores.forEach(function(score, indexScore) {
            var value = Math.round((score - minValue) * 255 / amplitude);
            var index = indexScore + (indexFile * size);
            buffer.writeUInt8(value, index);
        });
    });
    return buffer;
};

var callback = function(error) {
    if (error) {
        console.log("error:");
        console.log(error);
    } else {
        console.log("file saved!");
    }
};
if (dnaMatrices.length) {
    var dnaBuffer = bufferize(dnaMatrices, 5 * 5);
    fs.writeFile("DNAmatrices.texture", dnaBuffer, callback);
}
if (proteinMatrices.length) {
    var proteinBuffer = bufferize(proteinMatrices, 23 * 23);
    fs.writeFile("Proteinmatrices.texture", proteinBuffer, callback);
}
