"use strict";

var utils = require('./utils.js');
var applyProperties = require('./apply-props.js');

var render = new utils._class({
    create : function(node) {
        var vNode = node;
        if (utils.isWidget(vNode)) {
            return vNode.init();
        } else if (utils.isVText(vNode)) {
            return document.createTextNode(vNode.text)
        } else if (!utils.isVNode(vNode)) {
            
            return null;
        }
        var node = (vNode.namespace === null) ?
            document.createElement(vNode.tagName) :
            document.createElementNS(vNode.namespace, vNode.tagName);
        
        var props = vNode.properties;
        new applyProperties(node, props);
        
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
    
    type : 'V-RENDER'
    
});

module.exports = render;