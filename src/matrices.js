"use strict";

/*exported Matrix*/
//parameters: matrix[, name][, dna]
function Matrix(parameters) {
    var dnaSeq = ["A", "C", "G", "T", "X"];
    var aaSeq = ["A","R","N","D","C","Q","E","G","H","I","L","K","M","F","P","S","T","W","Y","V","B","Z","X"];
    this.internalMatrix = {};
    this.scoreMatrix = {};
    if (typeof parameters.name === "undefined") {
        this.name = "custom";
    } else {
        this.name = parameters.name;
    }
    if (Array.isArray(parameters.matrix)) {
        if (parameters.matrix.length === dnaSeq.length) {
            this.dna = true;
        } else if (parameters.matrix.length === aaSeq.length) {
            this.dna = false;
        } else {
            throw "matrix not valid";
        }
        //find min/max and define amplitude
        var min = parameters.matrix[0][0];
        var max = min;
        for (var i = 0; i < parameters.matrix.length; i++) {
            for (var j = 0; j < parameters.matrix[i].length; j++) {
                min = Math.min(min, parameters.matrix[i][j]);
                max = Math.max(max, parameters.matrix[i][j]);
            }
        }
        var amplitude = max - min;
        //fill matrices;
        var initSeq = (this.dna ? dnaSeq : aaSeq);
        for (var i = 0; i < parameters.matrix.length; i++) {
            this.internalMatrix[initSeq[i]] = {};
            this.scoreMatrix[initSeq[i]] = {};
            for (var j = 0; j < parameters.matrix[i].length; j++) {
                var value = parameters.matrix[i][j];
                this.internalMatrix[initSeq[i]][initSeq[j]] = Math.round((value - min) * 255 / amplitude);
                this.scoreMatrix[initSeq[i]][initSeq[j]] = value;
            }
        }
        this.score = function(el1, el2) {
            return this.internalMatrix[el1][el2];
        };
    } else {//suppose we want identity matrix
        var initSeq = (parameters.dna ? dnaSeq : aaSeq);
        this.dna = parameters.dna;
        for (var i = 0; i < initSeq.length; i++) {
            this.internalMatrix[initSeq[i]] = {};
            this.scoreMatrix[initSeq[i]] = {};
            for (var j = 0; j < initSeq.length; j++) {
                this.internalMatrix[initSeq[i]][initSeq[j]] = (i === j ? 255 : 0);
                this.scoreMatrix[initSeq[i]][initSeq[j]] = (i === j ? 1 : 0);
            }
        }
        this.score = function(el1, el2) {
            return (el1 === el2 ? 255 : 0);
        };
    }
}

//the different matrix
var mat1 = new Matrix({
    name: "identity matrix",
    matrix: "identity",
    dna: true
});


var mat4 = new Matrix({
    name: "Blosum62 matrix",
    matrix: [
        [ 4, -1, -2, -2,  0, -1, -1,  0, -2, -1, -1, -1, -1, -2, -1,  1,  0, -3, -2,  0, -2, -1,  0],
        [-1,  5,  0, -2, -3,  1,  0, -2,  0, -3, -2,  2, -1, -3, -2, -1, -1, -3, -2, -3, -1,  0, -1],
        [-2,  0,  6,  1, -3,  0,  0,  0,  1, -3, -3,  0, -2, -3, -2,  1,  0, -4, -2, -3,  3,  0, -1],
        [-2 ,-2,  1,  6, -3,  0,  2, -1, -1, -3, -4, -1, -3, -3, -1,  0, -1, -4, -3, -3,  4,  1, -1],
        [ 0, -3, -3, -3,  9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1, -3, -3, -2],
        [-1,  1,  0,  0, -3,  5,  2, -2,  0, -3, -2,  1,  0, -3, -1,  0, -1, -2, -1, -2,  0,  3, -1],
        [-1,  0,  0,  2, -4,  2,  5, -2,  0, -3, -3,  1, -2, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1],
        [ 0, -2,  0, -1, -3, -2, -2,  6, -2, -4, -4, -2, -3, -3, -2,  0, -2, -2, -3, -3, -1, -2, -1],
        [-2,  0,  1, -1, -3,  0,  0, -2,  8, -3, -3, -1, -2, -1, -2, -1, -2, -2,  2, -3,  0,  0, -1],
        [-1, -3, -3, -3, -1, -3, -3, -4, -3,  4,  2, -3,  1,  0, -3, -2, -1, -3, -1,  3, -3, -3, -1],
        [-1, -2, -3, -4, -1, -2, -3, -4, -3,  2,  4, -2,  2,  0, -3, -2, -1, -2, -1,  1, -4, -3, -1],
        [-1,  2,  0, -1, -3,  1,  1, -2, -1, -3, -2,  5, -1, -3, -1,  0, -1, -3, -2, -2,  0,  1, -1],
        [-1, -1, -2, -3, -1,  0, -2, -3, -2,  1,  2, -1,  5,  0, -2, -1, -1, -1, -1,  1, -3, -1, -1],
        [-2, -3, -3, -3, -2, -3, -3, -3, -1,  0,  0, -3,  0,  6, -4, -2, -2,  1,  3, -1, -3, -3, -1],
        [-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4,  7, -1, -1, -4, -3, -2, -2, -1, -2],
        [ 1, -1,  1,  0, -1,  0,  0,  0, -1, -2, -2,  0, -1, -2, -1,  4,  1, -3, -2, -2,  0,  0,  0],
        [ 0, -1,  0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1,  1,  5, -2, -2,  0, -1, -1,  0],
        [-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1,  1, -4, -3, -2, 11,  2, -3, -4, -3, -2],
        [-2, -2, -2, -3, -2, -1, -2, -3,  2, -1, -1, -2, -1,  3, -3, -2, -2,  2,  7, -1, -3, -2, -1],
        [-2, -1,  3,  4, -3,  0,  1, -1,  0, -3, -4,  0, -3, -3, -2,  0, -1, -4, -3, -3,  4,  1, -1],
        [ 0, -3, -3, -3, -1, -2, -2, -3, -3,  3,  1, -2,  1, -1, -2, -2,  0, -3, -1,  4, -3, -3, -2],
        [-1,  0,  0,  1, -3,  3,  4, -2,  0, -3, -3,  1, -1, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1],
        [ 0, -1, -1, -1, -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2,  0,  0, -2, -1, -1, -1, -1, -1]
    ]
});

var mat13 = new Matrix({
    name: "PAM250 matrix",
    matrix: [
        [ 2, -2,  0,  0, -2,  0,  0,  1, -1, -1, -2, -1, -1, -3,  1,  1,  1, -6, -3,  0,  0,  0, -1],
        [-2,  6,  0, -1, -4,  1, -1, -3,  2, -2, -3,  3,  0, -4,  0,  0, -1,  2, -4, -2, -1,  0, -1],
        [ 0,  0,  2,  2, -4,  1,  1,  0,  2, -2, -3,  1, -2, -3,  0,  1,  0, -4, -2, -2,  2,  1, -1],
        [ 0, -1,  2,  4, -5,  2,  3,  1,  1, -2, -4,  0, -3, -6, -1,  0,  0, -7, -4, -2,  3,  3, -1],
        [-2, -4, -4, -5, 12, -5, -5, -3, -3, -2, -6, -5, -5, -4, -3,  0, -2, -8,  0, -2, -4, -5, -1],
        [ 0,  1,  1,  2, -5,  4,  2, -1,  3, -2, -2,  1, -1, -5,  0, -1, -1, -5, -4, -2,  1,  3, -1],
        [ 0, -1,  1,  3, -5,  2,  4,  0,  1, -2, -3,  0, -2, -5, -1,  0,  0, -7, -4, -2,  3,  3, -1],
        [ 1, -3,  0,  1, -3, -1,  0,  5, -2, -3, -4, -2, -3, -5,  0,  1,  0, -7, -5, -1,  0,  0, -1],
        [-1,  2,  2,  1, -3,  3,  1, -2,  6, -2, -2,  0, -2, -2,  0, -1, -1, -3,  0, -2,  1,  2, -1],
        [-1, -2, -2, -2, -2, -2, -2, -3, -2,  5,  2, -2,  2,  1, -2, -1,  0, -5, -1,  4, -2, -2, -1],
        [-2, -3, -3, -4, -6, -2, -3, -4, -2,  2,  6, -3,  4,  2, -3, -3, -2, -2, -1,  2, -3, -3, -1],
        [-1,  3,  1,  0, -5,  1,  0, -2,  0, -2, -3,  5,  0, -5, -1,  0,  0, -3, -4, -2,  1,  0, -1],
        [-1,  0, -2, -3, -5, -1, -2, -3, -2,  2,  4,  0,  6,  0, -2, -2, -1, -4, -2,  2, -2, -2, -1],
        [-3, -4, -3, -6, -4, -5, -5, -5, -2,  1,  2, -5,  0,  9, -5, -3, -3,  0,  7, -1, -4, -5, -1],
        [ 1,  0,  0, -1, -3,  0, -1,  0,  0, -2, -3, -1, -2, -5,  6,  1,  0, -6, -5, -1, -1,  0, -1],
        [ 1,  0,  1,  0,  0, -1,  0,  1, -1, -1, -3,  0, -2, -3,  1,  2,  1, -2, -3, -1,  0,  0, -1],
        [ 1, -1,  0,  0, -2, -1,  0,  0, -1,  0, -2,  0, -1, -3,  0,  1,  3, -5, -3,  0,  0, -1, -1],
        [-6,  2, -4, -7, -8, -5, -7, -7, -3, -5, -2, -3, -4,  0, -6, -2, -5, 17,  0, -6, -5, -6, -1],
        [-3, -4, -2, -4,  0, -4, -4, -5,  0, -1, -1, -4, -2,  7, -5, -3, -3,  0, 10, -2, -3, -4, -1],
        [ 0, -2, -2, -2, -2, -2, -2, -1, -2,  4,  2, -2,  2, -1, -1, -1,  0, -6, -2,  4, -2, -2, -1],
        [ 0, -1,  2,  3, -4,  1,  3,  0,  1, -2, -3,  1, -2, -4, -1,  0,  0, -5, -3, -2,  3,  2, -1],
        [ 0,  0,  1,  3, -5,  3,  3,  0,  2, -2, -3,  0, -2, -5,  0,  0, -1, -6, -4, -2,  2,  3, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
   ]
};
console.log("A-A 255 255: " + mat1.score("A", "A") + " " + mat2.score("A", "A");
console.log("X-X 45  255: " + mat1.score("X", "X") + " " + mat2.score("X", "X");
console.log("A-X 0     0: " + mat1.score("A", "X") + " " + mat2.score("A", "X");
console.log("G-A 135   0: " + mat1.score("G", "A") + " " + mat2.score("G", "A");
console.log("A-T 180   0: " + mat1.score("A", "T") + " " + mat2.score("A", "T");
console.log(mat1.internalMatrix);
console.log(mat1.scoreMatrix);
console.log(mat2.internalMatrix);
console.log(mat2.scoreMatrix);

//Alors blosum 30, 45, 62ok4, 65, 10
//Pam 30, 80, 120, 160, 200, 220, 250ok13