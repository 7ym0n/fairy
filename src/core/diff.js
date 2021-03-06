"use strict";

var Utils = require('./utils.js');
var ApplyProperties = require('./apply-props.js');
var Handle = require('./handle.js');
var VPatch = require('./v-patch.js');

var Diff = new Utils._class({
    create : function(a, b) {
        this.patch = { a: a };
        this.a = a;
        this.b = b;

        return this.diff();
    },
    diff : function() {
        return this.walk(this.a, this.b, this.patch, 0);
    },
    
    walk : function(a, b, patch, index) {
        if (a === b) {
            return ;
        }
        
        var apply = patch[index];
        var applyClear = false;
        
        if(Utils.isThunk(a) || Utils.isThunk(b)) {
            this.thunks(a, b, patch, index);
        } else if(b == null) {
            if(Utils.isWidget(a)) {
                this.clearState(a, patch, index);
                apply = patch[index];
            }
            
            apply = this.appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
        } else if (Utils.isVNode(b)) {
            if(Utils.isVNode(a)) {
                if( a.tagName === b.tagName && 
                    a.namespace === b.namespace &&
                    a.key === b.key) {
                    var propsPatch = this.diffProps(a.properties, b.properties);
                    if(propsPatch) {
                        apply = this.appendPatch(apply, new VPatch(VPatch.PROPS, a, propsPatch));
                    }
                    apply = this.diffChildren(a, b, patch, apply, index);
                } else {
                    apply = this.appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                    applyClear = true;
                }
            } else {
                apply = this.appendPatch(apply, new VPatch(VPatch.VNODE, a, b));
                applyClear = true;
            }
        } else if(Utils.isVText(b)) {
            if(!Utils.isVText(a)) {
                apply = this.appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
                applyClear = true;
            } else if (a.text !== b.text) {
                apply = this.appendPatch(apply, new VPatch(VPatch.VTEXT, a, b));
            }
        } else if (Utils.isWidget(b)) {
            if (!Utils.isWidget(a)) {
                applyClear = true;
            }

            apply = this.appendPatch(apply, new VPatch(VPatch.WIDGET, a, b));
        }

        if (apply) {
            patch[index] = apply;
        }

        if (applyClear) {
            this.clearState(a, patch, index);
        }
        
        return this;
    },
    diffProps : function(a, b) {
        var diff

        for (var aKey in a) {
            if (!(aKey in b)) {
                diff = diff || {}
                diff[aKey] = undefined
            }

            var aValue = a[aKey]
            var bValue = b[aKey]

            if (aValue === bValue) {
                continue
            } else if (Utils.isObject(aValue) && Utils.isObject(bValue)) {
                if (this.getPrototype(bValue) !== this.getPrototype(aValue)) {
                    diff = diff || {}
                    diff[aKey] = bValue
                } else if (Utils.isVHook(bValue)) {
                     diff = diff || {}
                     diff[aKey] = bValue
                } else {
                    var objectDiff = this.diffProps(aValue, bValue)
                    if (objectDiff) {
                        diff = diff || {}
                        diff[aKey] = objectDiff
                    }
                }
            } else {
                diff = diff || {}
                diff[aKey] = bValue
            }
        }

        for (var bKey in b) {
            if (!(bKey in a)) {
                diff = diff || {}
                diff[bKey] = b[bKey]
            }
        }

        return diff
    },
    diffChildren : function(a, b, patch, apply, index) {
        var aChildren = a.children;
        var orderedSet = this.reorder(aChildren, b.children);
        var bChildren = orderedSet.children;

        var aLen = aChildren.length;
        var bLen = bChildren.length;
        var len = aLen > bLen ? aLen : bLen;

        for (var i = 0; i < len; i++) {
            var leftNode = aChildren[i];
            var rightNode = bChildren[i];
            index += 1;

            if (!leftNode) {
                if (rightNode) {
                    // Excess nodes in b need to be added
                    apply = this.appendPatch(apply,
                        new VPatch(VPatch.INSERT, null, rightNode));
                }
            } else {
                this.walk(leftNode, rightNode, patch, index);
            }

            if (Utils.isVNode(leftNode) && leftNode.count) {
                index += leftNode.count;
            }
        }

        if (orderedSet.moves) {
            // Reorder nodes last
            apply = this.appendPatch(apply, new VPatch(
                VPatch.ORDER,
                a,
                orderedSet.moves
            ));
        }

        return apply
    },
    clearState : function(vNode, patch, index){
        this.unhook(vNode, patch, index);
        this.destroyWidgets(vNode, patch, index);
    },
    destroyWidgets : function(vNode, patch, index) {
        if (Utils.isWidget(vNode)) {
            if (typeof vNode.destroy === "function") {
                patch[index] = this.appendPatch(
                    patch[index],
                    new VPatch(VPatch.REMOVE, vNode, null)
                );
            }
        } else if (Utils.isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
            var children = vNode.children;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                var child = children[i];
                index += 1;

                this.destroyWidgets(child, patch, index);

                if (Utils.isVNode(child) && child.count) {
                    index += child.count;
                }
            }
        } else if (Utils.isThunk(vNode)) {
            this.thunks(vNode, null, patch, index);
        }
    },
    thunks : function(a, b, patch, index) {
        var nodes = new Handle(a, b);
        var thunkPatch = new Diff(nodes.a, nodes.b);
        if (this.hasPatches(thunkPatch)) {
            patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch);
        }
    },
    hasPatches : function(patch) {
        for (var index in patch) {
            if (index !== "a") {
                return true;
            }
        }

        return false;
    },
    unhook : function(vNode, patch, index) {
        if (Utils.isVNode(vNode)) {
            if (vNode.hooks) {
                patch[index] = this.appendPatch(
                    patch[index],
                    new VPatch(
                        VPatch.PROPS,
                        vNode,
                        this.undefinedKeys(vNode.hooks)
                    )
                );
            }

            if (vNode.descendantHooks || vNode.hasThunks) {
                var children = vNode.children;
                var len = children.length;
                for (var i = 0; i < len; i++) {
                    var child = children[i];
                    index += 1;

                    this.unhook(child, patch, index);

                    if (Utils.isVNode(child) && child.count) {
                        index += child.count;
                    }
                }
            }
        } else if (Utils.isThunk(vNode)) {
            this.thunks(vNode, null, patch, index);
        }
    },
    undefinedKeys :  function(obj) {
        var result = {};

        for (var key in obj) {
            result[key] = undefined;
        }

        return result;
    },
    reorder : function(aChildren, bChildren) {
        // O(M) time, O(M) memory
        var bChildIndex = this.keyIndex(bChildren);
        var bKeys = bChildIndex.keys;
        var bFree = bChildIndex.free;

        if (bFree.length === bChildren.length) {
            return {
                children: bChildren,
                moves: null
            };
        }

        // O(N) time, O(N) memory
        var aChildIndex = this.keyIndex(aChildren);
        var aKeys = aChildIndex.keys;
        var aFree = aChildIndex.free;

        if (aFree.length === aChildren.length) {
            return {
                children: bChildren,
                moves: null
            };
        }

        // O(MAX(N, M)) memory
        var newChildren = [];

        var freeIndex = 0;
        var freeCount = bFree.length;
        var deletedItems = 0;

        // Iterate through a and match a node in b
        // O(N) time,
        for (var i = 0 ; i < aChildren.length; i++) {
            var aItem = aChildren[i];
            var itemIndex;

            if (aItem.key) {
                if (bKeys.hasOwnProperty(aItem.key)) {
                    // Match up the old keys
                    itemIndex = bKeys[aItem.key];
                    newChildren.push(bChildren[itemIndex]);

                } else {
                    // Remove old keyed items
                    itemIndex = i - deletedItems++;
                    newChildren.push(null);
                }
            } else {
                // Match the item in a with the next free item in b
                if (freeIndex < freeCount) {
                    itemIndex = bFree[freeIndex++];
                    newChildren.push(bChildren[itemIndex]);
                } else {
                    // There are no free items in b to match with
                    // the free items in a, so the extra free nodes
                    // are deleted.
                    itemIndex = i - deletedItems++;
                    newChildren.push(null);
                }
            }
        }

        var lastFreeIndex = freeIndex >= bFree.length ?
            bChildren.length :
            bFree[freeIndex];

        // Iterate through b and append any new keys
        // O(M) time
        for (var j = 0; j < bChildren.length; j++) {
            var newItem = bChildren[j];

            if (newItem.key) {
                if (!aKeys.hasOwnProperty(newItem.key)) {
                    // Add any new keyed items
                    // We are adding new items to the end and then sorting them
                    // in place. In future we should insert new items in place.
                    newChildren.push(newItem);
                }
            } else if (j >= lastFreeIndex) {
                // Add any leftover non-keyed items
                newChildren.push(newItem);
            }
        }

        var simulate = newChildren.slice();
        var simulateIndex = 0;
        var removes = [];
        var inserts = [];
        var simulateItem;

        for (var k = 0; k < bChildren.length;) {
            var wantedItem = bChildren[k];
            simulateItem = simulate[simulateIndex];

            // remove items
            while (simulateItem === null && simulate.length) {
                removes.push(remove(simulate, simulateIndex, null));
                simulateItem = simulate[simulateIndex];
            }

            if (!simulateItem || simulateItem.key !== wantedItem.key) {
                // if we need a key in this position...
                if (wantedItem.key) {
                    if (simulateItem && simulateItem.key) {
                        // if an insert doesn't put this key in place, it needs to move
                        if (bKeys[simulateItem.key] !== k + 1) {
                            removes.push(this.remove(simulate, simulateIndex, simulateItem.key));
                            simulateItem = simulate[simulateIndex];
                            // if the remove didn't put the wanted item in place, we need to insert it
                            if (!simulateItem || simulateItem.key !== wantedItem.key) {
                                inserts.push({key: wantedItem.key, to: k});
                            }
                            // items are matching, so skip ahead
                            else {
                                simulateIndex++;
                            }
                        }
                        else {
                            inserts.push({key: wantedItem.key, to: k});
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k});
                    }
                    k++
                }
                // a key in simulate has no matching wanted key, remove it
                else if (simulateItem && simulateItem.key) {
                    removes.push(this.remove(simulate, simulateIndex, simulateItem.key));
                }
            }
            else {
                simulateIndex++;
                k++;
            }
        }

        // remove all the remaining nodes from simulate
        while(simulateIndex < simulate.length) {
            simulateItem = simulate[simulateIndex]
            removes.push(this.remove(simulate, simulateIndex, simulateItem && simulateItem.key));
        }

        // If the only moves we have are deletes then we can just
        // let the delete patch remove these items.
        if (removes.length === deletedItems && !inserts.length) {
            return {
                children: newChildren,
                moves: null
            };
        }

        return {
            children: newChildren,
            moves: {
                removes: removes,
                inserts: inserts
            }
        };
    },
    remove : function(arr, index, key) {
        arr.splice(index, 1)

        return {
            from: index,
            key: key
        }
    },
    keyIndex :  function(children) {
        var keys = {}
        var free = []
        var length = children.length

        for (var i = 0; i < length; i++) {
            var child = children[i]

            if (child.key) {
                keys[child.key] = i
            } else {
                free.push(i)
            }
        }

        return {
            keys: keys,     // A hash of key name to index
            free: free      // An array of unkeyed item indices
        }
    },
    appendPatch : function(apply, patch) {
        if (apply) {
            if (isArray(apply)) {
                apply.push(patch);
            } else {
                apply = [apply, patch];
            }

            return apply;
        } else {
            return patch;
        }
    },
    getPrototype : function(value) {
      if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
      } else if (value.__proto__) {
        return value.__proto__
      } else if (value.constructor) {
        return value.constructor.prototype
      }
    },
    getPatch : function() {
        return this.patch;
    },
    type : 'V-DIFF'
});

module.exports = Diff;