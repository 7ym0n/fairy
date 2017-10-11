"use strict";

var utils = require('./utils.js');

var VText = new utils._class({
    create : function(text){
        this.text = String(text)
    },
    type : 'V-TEXT'
    
});

module.exports = VText;