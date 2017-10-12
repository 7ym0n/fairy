"use strict";

var Utils = require('./utils.js');
var ApplyProperties = require('./apply-props.js');
var Handle = require('./handle.js');

var Render = new Utils._class({
    create : function(node) {
        var vNode = (new Handle(node)).a;
        if (Utils.isWidget(vNode)) {
            return vNode.init();
        } else if (Utils.isVText(vNode)) {
            return document.createTextNode(vNode.text)
        } else if (!Utils.isVNode(vNode)) {
            
            return null;
        }
        var node = (vNode.namespace === null) ?
            document.createElement(vNode.tagName) :
            document.createElementNS(vNode.namespace, vNode.tagName);
        
        var props = vNode.properties;
        new ApplyProperties(node, props);
        
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

module.exports = Render;