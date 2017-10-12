"use strict";

var Utils = require('./utils.js');

var VPatch = new Utils._class({
    create : function(op, vNode, patch) {
        this.op = Number(op)
        this.vNode = vNode
        this.patch = patch
    },
    type : 'V-PATCH'
    
});

VPatch.NONE = 0
VPatch.VTEXT = 1
VPatch.VNODE = 2
VPatch.WIDGET = 3
VPatch.PROPS = 4
VPatch.ORDER = 5
VPatch.INSERT = 6
VPatch.REMOVE = 7
VPatch.THUNK = 8

VPatch.addOp = function(key, value) {
    VPatch[key] = value;
    return VPatch;
};

VPatch.getOp = function(key){
        return VPatch[key];
}
module.exports = VPatch;