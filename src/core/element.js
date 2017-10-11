"use strict";

var utils = require('./utils.js');
var VNode = require('./v-node.js');
var VText = require('./v-text.js');
var hook = require('./hook.js');

function isChild(p) {
    return utils.isVNode(p) || utils.isVText(p);
}

function isChildren(params) {
    return utils.isString(params) || utils.isArray(params) || isChild(params);
}

var element = new utils._class({
    create : function (tagName, properties, children) {
        var childNodes = [];
        var tag, props, key, namespace;
        
        if(!children && isChildren(properties)) {
            children = properties;
            props = {};
        }
        
        props = props || properties || {};
        tag = this.parseTag(tagName, props);
        this.transformProperties(props);
        
        if(children !== undefined && children !== null) {
            this.addChild(children, childNodes, tag, props);
        }
        return new VNode(tag, props, childNodes, key, namespace);
    },
    parseTag : function(tagName, props) {
        var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
        var notClassId = /^\.|#/;
        if(!tagName) {
            return 'DIV';
        }
        var noId = !(props.hasOwnProperty('id'));
        var tagParts = utils.split(tagName, classIdSplit);
        var tag = null;
        
        if (notClassId.test(tagParts[1])) {
            tag = tagParts[0];
        }

        var classes, part, type, i;

        for (i = 0; i < tagParts.length; i++) {
            part = tagParts[i];

            if (!part) {
                continue;
            }

            type = part.charAt(0);

            if (!tag) {
                tag = part;
            } else if (type === '.') {
                classes = classes || [];
                classes.push(part.substring(1, part.length));
            } else if (type === '#' && noId) {
                props.id = part.substring(1, part.length);
            }
        }

        if (classes) {
            if (props.className) {
                classes.push(props.className);
            }

            props.className = classes.join(' ');
        }

        return props.namespace ? tag : tag.toUpperCase();
        
    },
    transformProperties : function(props) {
        for (var propName in props) {
            if (props.hasOwnProperty(propName)) {
                var value = props[propName];

                if (utils.isVHook(value)) {
                    continue;
                }

                if (propName.substr(0, 3) === 'ev-') {
                    // add ev-foo support
                    props[propName] = new hook(value);
                }
            }
        }
    },
    addChild : function(c, childNodes, tag, props) {
        if (utils.isString(c)) {
            childNodes.push(new VText(c));
        } else if (utils.isNumber(c)) {
            childNodes.push(new VText(String(c)));
        } else if (isChild(c)) {
            childNodes.push(c);
        } else if (utils.isArray(c)) {
            for (var i = 0; i < c.length; i++) {
                this.addChild(c[i], childNodes, tag, props);
            }
        } else if (c === null || c === undefined) {
            return;
        } else {
            throw new Error("add child error");
        }
    },
    
    type: 'V-ELEM'
});

module.exports = element;