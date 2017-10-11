"use strict";

var utils = require('./utils.js');

var VPatch = new utils._class({
    create : function(op, vNode, patch) {
        this.op = Number(op)
        this.vNode = vNode
        this.patch = patch
    },
    type : 'V-PATCH'
    
});