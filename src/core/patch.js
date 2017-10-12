"use strict";

var Utils = require('./utils.js');
var Element = require('./element.js');
var ApplyProperties = require('./apply-props.js');
var VPatch = require('./v-patch.js');

var Patch = new Utils._class({
    create : function(rootNode, patches, renderOptions) {
        renderOptions = renderOptions || this;
        renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
            ? renderOptions.patch
            : this.patchRecursive;
        renderOptions.render = renderOptions.render || Element;

        return renderOptions.patch(rootNode, patches, renderOptions);
    },
    patchRecursive : function(rootNode, patches, renderOptions) {
        var indices = this.patchIndices(patches);

        if (indices.length === 0) {
            return rootNode;
        }

        var index = this.domIndex(rootNode, patches.a, indices);
        var ownerDocument = rootNode.ownerDocument;

        if (!renderOptions.document && ownerDocument !== document) {
            renderOptions.document = ownerDocument;
        }

        for (var i = 0; i < indices.length; i++) {
            var nodeIndex = indices[i];
            rootNode = this.applyPatch(rootNode,
                index[nodeIndex],
                patches[nodeIndex],
                renderOptions);
        }

        return rootNode;
    },
    domIndex : function(rootNode, tree, indices, nodes) {
        if (!indices || indices.length === 0) {
            return {}
        } else {
            indices.sort(this.ascending)
            return this.recurse(rootNode, tree, indices, nodes, 0);
        }
    },
    recurse : function(rootNode, tree, indices, nodes, rootIndex) {
        nodes = nodes || {};

        if (rootNode) {
            if (this.indexInRange(indices, rootIndex, rootIndex)) {
                nodes[rootIndex] = rootNode;
            }

            var vChildren = tree.children;

            if (vChildren) {

                var childNodes = rootNode.childNodes;

                for (var i = 0; i < tree.children.length; i++) {
                    rootIndex += 1;

                    var vChild = vChildren[i] || noChild;
                    var nextIndex = rootIndex + (vChild.count || 0);

                    // skip recursion down the tree if there are no nodes down here
                    if (this.indexInRange(indices, rootIndex, nextIndex)) {
                        this.recurse(childNodes[i], vChild, indices, nodes, rootIndex);
                    }

                    rootIndex = nextIndex;
                }
            }
        }

        return nodes;
    },
    indexInRange : function(indices, left, right) {
        if (indices.length === 0) {
            return false;
        }

        var minIndex = 0;
        var maxIndex = indices.length - 1;
        var currentIndex;
        var currentItem;

        while (minIndex <= maxIndex) {
            currentIndex = ((maxIndex + minIndex) / 2) >> 0;
            currentItem = indices[currentIndex];

            if (minIndex === maxIndex) {
                return currentItem >= left && currentItem <= right;
            } else if (currentItem < left) {
                minIndex = currentIndex + 1;
            } else  if (currentItem > right) {
                maxIndex = currentIndex - 1;
            } else {
                return true;
            }
        }

        return false;
    },
    ascending : function(a, b) {
        return a > b ? 1 : -1;
    },
    applyPatch : function(rootNode, domNode, patchList, renderOptions) {
        if (!domNode) {
            return rootNode;
        }

        var newNode

        if (Utils.isArray(patchList)) {
            for (var i = 0; i < patchList.length; i++) {
                newNode = this.patchOp(patchList[i], domNode, renderOptions);

                if (domNode === rootNode) {
                    rootNode = newNode;
                }
            }
        } else {
            newNode = this.patchOp(patchList, domNode, renderOptions);

            if (domNode === rootNode) {
                rootNode = newNode;
            }
        }

        return rootNode;
    },
    patchIndices : function(patches) {
        var indices = [];

        for (var key in patches) {
            if (key !== "a") {
                indices.push(Number(key));
            }
        }

        return indices;
    },
    patchOp: function(vpatch, domNode, renderOptions) {
        var op = vpatch.op;
        var vNode = vpatch.vNode;
        var patch = vpatch.patch;

        switch (op) {
            case VPatch.REMOVE:
                return this.removeNode(domNode, vNode);
            case VPatch.INSERT:
                return this.insertNode(domNode, patch, renderOptions);
            case VPatch.VTEXT:
                return this.stringPatch(domNode, vNode, patch, renderOptions);
            case VPatch.WIDGET:
                return this.widgetPatch(domNode, vNode, patch, renderOptions);
            case VPatch.VNODE:
                return this.vNodePatch(domNode, vNode, patch, renderOptions);
            case VPatch.ORDER:
                this.reorderChildren(domNode, patch);
                return domNode
            case VPatch.PROPS:
                new ApplyProperties(domNode, patch, vNode.properties);
                return domNode
            case VPatch.THUNK:
                return this.replaceRoot(domNode,
                    renderOptions.patch(domNode, patch, renderOptions));
            default:
                return domNode;
        }
    },
    removeNode : function(domNode, vNode) {
        var parentNode = domNode.parentNode

        if (parentNode) {
            parentNode.removeChild(domNode)
        }

        destroyWidget(domNode, vNode);

        return null
    },
    insertNode : function(parentNode, vNode, renderOptions) {
        var newNode = new renderOptions.render(vNode, renderOptions);

        if (parentNode) {
            parentNode.appendChild(newNode);
        }

        return parentNode;
    },
    stringPatch : function(domNode, leftVNode, vText, renderOptions) {
        var newNode;

        if (domNode.nodeType === 3) {
            domNode.replaceData(0, domNode.length, vText.text);
            newNode = domNode;
        } else {
            var parentNode = domNode.parentNode;
            newNode = new renderOptions.render(vText, renderOptions);

            if (parentNode && newNode !== domNode) {
                parentNode.replaceChild(newNode, domNode);
            }
        }

        return newNode
    },
    widgetPatch : function(domNode, leftVNode, widget, renderOptions) {
        var updating = this.updateWidget(leftVNode, widget);
        var newNode;

        if (updating) {
            newNode = widget.update(leftVNode, domNode) || domNode;
        } else {
            newNode = new renderOptions.render(widget, renderOptions);
        }

        var parentNode = domNode.parentNode;

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode);
        }

        if (!updating) {
            this.destroyWidget(domNode, leftVNode);
        }

        return newNode
    },
    updateWidget : function(){
        if (Utils.isWidget(a) && Utils.isWidget(b)) {
            if ("name" in a && "name" in b) {
                return a.id === b.id;
            } else {
                return a.init === b.init;
            }
        }
        return false;
    },
    vNodePatch : function(domNode, leftVNode, vNode, renderOptions) {
        var parentNode = domNode.parentNode;
        var newNode = new renderOptions.render(vNode, renderOptions);

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode);
        }

        return newNode;
    },
    destroyWidget : function(domNode, w) {
        if (typeof w.destroy === "function" && isWidget(w)) {
            w.destroy(domNode);
        }
    },
    reorderChildren : function(domNode, moves) {
        var childNodes = domNode.childNodes;
        var keyMap = {};
        var node;
        var remove;
        var insert;

        for (var i = 0; i < moves.removes.length; i++) {
            remove = moves.removes[i];
            node = childNodes[remove.from];
            if (remove.key) {
                keyMap[remove.key] = node;
            }
            domNode.removeChild(node);
        }

        var length = childNodes.length
        for (var j = 0; j < moves.inserts.length; j++) {
            insert = moves.inserts[j];
            node = keyMap[insert.key];
            // this is the weirdest bug i've ever seen in webkit
            domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to]);
        }
    },
    replaceRoot : function(oldRoot, newRoot) {
        if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
            oldRoot.parentNode.replaceChild(newRoot, oldRoot);
        }

        return newRoot;
    },
    type : 'PATCH'
});

module.exports = Patch;