"use strict";

var Utils = require('./core/utils.js');
var Query = require('./core/query.js');
var Element = require('./core/element.js');
var Render = require('./core/render.js');
var Diff = require('./core/diff.js');
var Patch = require('./core/patch.js');

var _Fairy = new Utils._class({
    create : function(opts) {
        
    },
    query: Query,
    utils: Utils,
    element : Element,
    draw: Render,
    diff: Diff,
    patch: Patch
});

module.exports = _Fairy;