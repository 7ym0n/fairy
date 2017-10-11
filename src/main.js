"use strict";

var query = require('./core/query.js');
var utils = require('./core/utils.js');
var element = require('./core/element.js');
var render = require('./core/render.js');

window.fairy = {
    query: query,
    utils: utils,
    element:element,
    draw: render
}