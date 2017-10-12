"use strict";

var Utils = require('./utils.js');

var HandleThunk = new Utils._class({
    create : function(a, b){
        var renderedA = a
        var renderedB = b

        if (Utils.isThunk(b)) {
            renderedB = this.render(b, a)
        }

        if (Utils.isThunk(a)) {
            renderedA = this.render(a, null)
        }

        return {
            a: renderedA,
            b: renderedB
        }
    },
    render : function(thunk, previous) {
        var renderedThunk = thunk.vnode

        if (!renderedThunk) {
            renderedThunk = thunk.vnode = thunk.render(previous)
        }

        if (!(Utils.isVNode(renderedThunk) ||
                Utils.isVText(renderedThunk) ||
                Utils.isWidget(renderedThunk))) {
            throw new Error("thunk did not return a valid node");
        }

        return renderedThunk
    },
    type : Utils.V_THUNK
});

module.exports = HandleThunk;