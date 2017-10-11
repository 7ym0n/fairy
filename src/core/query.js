"use strict";

function query(el) {
    if(typeof el == 'string') {
        var query_selector = el;
        el = document.querySelector(el);
        if(!el) {
            log("cannot find element: " + query_selector);
            return document.createElement('div');
        }
    }
    return el;
}

module.exports = query;