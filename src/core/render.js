"use strict";

var utils = require('./utils.js');

var render = new utils._class({
    create : function(node) {
        var vNode = node;
        if (utils.isWidget(vNode)) {
            return vNode.init()
        } else if (utils.isVText(vNode)) {
            return document.createTextNode(vNode.text)
        } else if (!utils.isVNode(vNode)) {
            
            return null;
        }
        var node = (vNode.namespace === null) ?
            document.createElement(vNode.tagName) :
            document.createElementNS(vNode.namespace, vNode.tagName);
        
        var props = vNode.properties;
        this.applyProperties(node, props);
        
        var children = vNode.children;
        if(children) {
            for (var i = 0; i < children.length; i++) {
                var childNode = this.create(children[i]);
                if (childNode) {
                    node.appendChild(childNode);
                }
            }
        }
        
        return node;
    },
    applyProperties : function (node, props, previous) {
        for (var propName in props) {
            var propValue = props[propName];

            if (propValue === undefined) {
                this.removeProperty(node, propName, propValue, previous);
            } else if (utils.isVHook(propValue)) {
                this.removeProperty(node, propName, propValue, previous);
                if (propValue.hook) {
                    propValue.hook(node,
                        propName,
                        previous ? previous[propName] : undefined);
                }
            } else {
                if (utils.isObject(propValue)) {
                    this.patchObject(node, props, previous, propName, propValue);
                } else {
                    node[propName] = propValue;
                }
            }
        }
    },

    removeProperty : function (node, propName, propValue, previous) {
        if (previous) {
            var previousValue = previous[propName];

            if (!utils.isVHook(previousValue)) {
                if (propName === "attributes") {
                    for (var attrName in previousValue) {
                        node.removeAttribute(attrName);
                    }
                } else if (propName === "style") {
                    for (var i in previousValue) {
                        node.style[i] = "";
                    }
                } else if (typeof previousValue === "string") {
                    node[propName] = "";
                } else {
                    node[propName] = null;
                }
            } else if (previousValue.unhook) {
                previousValue.unhook(node, propName, propValue);
            }
        }
    },

    patchObject : function (node, props, previous, propName, propValue) {
        var previousValue = previous ? previous[propName] : undefined;

        // Set attributes
        if (propName === "attributes") {
            for (var attrName in propValue) {
                var attrValue = propValue[attrName];

                if (attrValue === undefined) {
                    node.removeAttribute(attrName);
                } else {
                    node.setAttribute(attrName, attrValue);
                }
            }

            return;
        }

        if(previousValue && utils.isObject(previousValue) &&
            this.getPrototype(previousValue) !== this.getPrototype(propValue)) {
            node[propName] = propValue;
            return;
        }

        if (!utils.isObject(node[propName])) {
            node[propName] = {};
        }

        var replacer = propName === "style" ? "" : undefined;

        for (var k in propValue) {
            var value = propValue[k];
            node[propName][k] = (value === undefined) ? replacer : value;
        }
    },

    getPrototype : function (value) {
        if (Object.getPrototypeOf) {
            return Object.getPrototypeOf(value);
        } else if (value.__proto__) {
            return value.__proto__;
        } else if (value.constructor) {
            return value.constructor.prototype;
        }
    },
    type : 'V-RENDER'
    
});

module.exports = render;