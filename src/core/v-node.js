"use strict";

var utils = require('./utils.js');

var VNode = new utils._class({
    create : function(tagName, properties, children, key, namespace){
        this.tagName = tagName
        this.properties = properties || noProperties
        this.children = children || noChildren
        this.key = key != null ? String(key) : undefined
        this.namespace = (typeof namespace === "string") ? namespace : null

        var count = (children && children.length) || 0
        var descendants = 0
        var hasWidgets = false
        var hasThunks = false
        var descendantHooks = false
        var hooks

        for (var propName in properties) {
            if (properties.hasOwnProperty(propName)) {
                var property = properties[propName]
                if (utils.isVHook(property) && property.unhook) {
                    if (!hooks) {
                        hooks = {}
                    }

                    hooks[propName] = property
                }
            }
        }

        for (var i = 0; i < count; i++) {
            var child = children[i]
            if (utils.isVNode(child)) {
                descendants += child.count || 0

                if (!hasWidgets && child.hasWidgets) {
                    hasWidgets = true
                }

                if (!hasThunks && child.hasThunks) {
                    hasThunks = true
                }

                if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                    descendantHooks = true
                }
            } else if (!hasWidgets && utils.isWidget(child)) {
                if (typeof child.destroy === "function") {
                    hasWidgets = true
                }
            } else if (!hasThunks && utils.isThunk(child)) {
                hasThunks = true;
            }
        }

        this.count = count + descendants
        this.hasWidgets = hasWidgets
        this.hasThunks = hasThunks
        this.hooks = hooks
        this.descendantHooks = descendantHooks
    },
    type : 'V-NODE'
    
});

module.exports = VNode;