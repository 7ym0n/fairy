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
    query: function(el){
        return new Query(el);
    },
    utils: Utils,
    element : function(tag, props, child) {return new Element(tag, props, child);},
    draw: function (node){return new Render(node);},
    diff: function(a, b){return new Diff(a,b);},
    patch: function(root, patch){return new Patch(root, patch);}
});

module.exports = _Fairy;