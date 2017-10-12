"use strict";

var Utils = require('./utils.js');

var VText = new Utils._class({
    create : function(text){
        this.text = String(text)
    },
    type : Utils.V_TEXT
    
});

module.exports = VText;