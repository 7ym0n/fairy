"use strict";

var _ = exports
_.log = function (msg) {
    console.log(msg);
}

_._class = function(properties){
    var ___ = function(){return (arguments[0] !== null && this.create && typeof(this.create) == 'function') ? this.create.apply(this, arguments) : this;};
    ___.prototype = properties;
    ___.prototype.defineProperty = function(obj, prop, descriptor) {
        Object.defineProperty(obj, prop, descriptor);
    }
    ___.prototype.getCurrentStyle = function(element){
        return element.currentStyle || document.defaultView.getComputedStyle(element, null);
    };
    ___.prototype.clone = function (obj, c) {  
        var c = c || {};
        var obj = obj || this;
        for (var i in obj) {
            if (_.isObject(obj[i])) {
                c[i] = (obj[i] && _.isArray(obj[i])) ? [] : {};
                this.clone(obj[i], c[i]);
            } else {
                c[i] = obj[i];
            }
　　　　}
　　　　return c;
    };
    ___.prototype.isEqual = function(obj) {
        return obj.type === this.type;
    };
    return ___;
};

_.type = function (obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '')
}

_.isArray = function (obj) {
    return _.type(obj) === 'Array';
}

_.slice = function (arr, index) {
    return Array.prototype.slice.call(arr, index);
}

_.isString = function (obj) {
    return _.type(obj) === 'String';
}

_.isObject = function (obj) {
    return _.type(obj) === 'Object';
}

_.isNumber = function (obj) {
    return _.type(obj) === 'Number';
}
_.isRegExp = function (obj) {
    return _.type(obj) === 'RegExp';
}

_.each = function (arr, fn) {
    for (var i = 0, len = arr.length; i < len; i++) {
        fn(arr[i], i);
    }
}

_.split = function (str, regexp, limit) {
    var arr = str.split(regexp), rst = [];
    for(var index in arr) {
        if(arr[index] != "") {
            rst.push(arr[index]);
        }
    }
    
    if(limit && _.isNumber(limit)) {
  
        if(limit > 0) {
            return rst.slice(0,limit);
        } else {
            return rst.slice(limit);
        }
        
    }
    
    return rst;
}

_.isVHook = function(hook) {
    return hook && hook.type == 'V-HOOK';
}

_.isVNode = function(node) {
    return node && node.type == 'V-NODE';
}

_.isVText = function(text) {
    return text && text.type == 'V-TEXT';
}
_.isWidget = function(w) {
    return w && w.type == 'V-WIDGET';
}
_.isThunk = function(t) {
    return t && t.type == 'V-THUNK';
}
