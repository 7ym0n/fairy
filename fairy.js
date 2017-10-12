"use strict";

var fairy = require('./src/main.js');

window.Fairy = function(opts) {
    return new fairy(opts);
};
module.exports = Fairy;