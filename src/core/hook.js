"use strict";

var Utils = require('./utils.js');

var Hook = new Utils._class({
    create : function (value) {
        this.hashKey = '__EV_STORE_KEY@3';
        this.value = value;
    },
    hook : function(node, propertyName) {
        var es = this.store(node);
        var propName = propertyName.substr(3);
        
        es[propName] = this.value;
    },
    unhook : function(node, propertyName) {
        var es = this.store(node);
        var propName = propertyName.substr(3);
        
        es[propName] = undefined;
    },
    store : function(elem) {
        
        var hash = elem[this.hashKey];
        if(!hash) {
            hash = elem[this.hashKey] = {};
        }
        return hash;
    },
    type : Utils.V_HOOK
});

module.exports = Hook;