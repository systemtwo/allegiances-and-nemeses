define(["lib/d3", "underscore", "backbone", "knockout", "text!/static/templates/nodeEditorActions.ko.html"],
function (d3, _, backbone, ko, buttonTemplate) {

    // Helper functions
    function uniquePath(territoryPath) {
        var pairs = [];
        _.each(territoryPath, function (point) {
            var exists = _.some(pairs, function (existingPoint) {
                return point[0] === existingPoint[0] && point[1] === existingPoint[1];
            });
            if (!exists) {
                pairs.push(point);
            }
        });
        return pairs;
    }

    var Node = function (point) {
        this.point = {
            x: point[0],
            y: point[1]
        };
        this.neighbours = [];
        this.territories = [];
        this.references = [];
        return this;
    };
    Node.prototype.getX = function () {
        return this.point.x;
    };
    Node.prototype.getY = function () {
        return this.point.y;
    };
    Node.prototype.updatePoint = function (x, y) {
        var node = this;
        if (_.isFinite(x)) {
            this.point.x = x;
        }
        if (_.isFinite(y)) {
            this.point.y = y;
        }

        _.each(node.references, function (linkedPoint) {
            linkedPoint[0] = node.point.x;
            linkedPoint[1] = node.point.y;
        })
    };
    Node.prototype.addNeighbour = function (newNeighbour) {
        var existingNeighbour = _.some(this.neighbours, function (node) {
            return node == newNeighbour;
        });
        if (!existingNeighbour) {
            this.neighbours.push(newNeighbour);
            newNeighbour.neighbours.push(this);
        }

    };
    Node.prototype.addReference = function (newPoint, territory) {
        var node = this;
        if (!node.atPoint(newPoint)) {
            console.error("Trying to add non-corresponding point");
            return;
        }

        this.territories = _.union(this.territories, [territory]);
        this.references = _.union(this.references, [newPoint]);
    };
    Node.prototype.atPoint = function(point) {
        var node = this;
        return node.point.x == point[0] && node.point.y == point[1];
    };
    Node.prototype.distance = function(node) {
        var frontier = [{
                node: this,
                distance: 0
            }],
            searched = [],
            current;
        _.each(this.neighbours, function(neighbour) {
            frontier.push({
                node: neighbour,
                distance: 1
            })
        });
        while (frontier.length > 0) {
            current = frontier.shift(); // unqueue the first item
            searched.push(current);
            if (current.node == node) {
                return current.distance;
            } else {
                _.each(current.node.neighbours, function (neighbour) {
                    var exists = _.some(frontier.concat(searched), function (frontierElement) {
                            return frontierElement.node == neighbour;
                        });
                    if (!exists) {
                        frontier.push({
                            node: neighbour,
                            distance: current.distance + 1
                        })
                    }
                })
            }
        }
    };
    Node.prototype.remove = function () {
        var node = this;
        _.each(this.territories, function (t) {
            t.displayInfo.path = _.filter(t.displayInfo.path, function (point) {
                return !node.atPoint(point);
            })
        })
    };

    var NodeEditor = backbone.View.extend({
        selectedNodes: ko.observableArray(),
        nodes: [],
        initialize: function (options) {
            var editor = this;
            this.territories = options.territories;
            this.nodes = this.createNodes(this.territories);
            this.viewModel = {
                actions: [
                    {
                        displayName: "Delete",
                        onClick: function () {
                            editor.remove(editor.selectedNodes())
                        },
                        enabled: ko.computed(function () {
                            return editor.selectedNodes().length > 0
                        })
                    },
                    {
                        displayName: "Merge",
                        onClick: function () {
                            editor.merge(editor.selectedNodes())
                        },
                        enabled: ko.computed(function () {
                            // TODO all nodes must be a cluster of neighbours
                            return editor.selectedNodes().length > 1;
                        })
                    },
                    {
                        displayName: "Split",
                        onClick: function () {
                            editor.split(editor.selectedNodes())
                        },
                        enabled: ko.computed(function () {
                            var selected = editor.selectedNodes();
                            return selected.length === 2 &&
                                selected[0].distance(selected[1]) === 1;
                        })
                    }
                ]
            };
            window.viewModel = this.viewModel;
        },

        render: function () {
            ko.applyBindings(this.viewModel, $(buttonTemplate).appendTo(this.$el)[0]);
            return this.$el;
        },

        // ACTIONS
        /**
         * Removes nodes from the paths of corresponding territories
         * @param nodes
         */
        remove: function (nodes) {
            _.each(nodes, function (node) {
                node.remove();
            });
            this.updateNodes();
        },
        /**
         * Consolidates all selected nodes to a single point.
         * Removes duplicate nodes in a path
         * @param nodes
         */
        merge: function (nodes) {
            // TODO check nodes are neighbours
            var affectedTerritories = [];

            var newX = nodes[0].getX(),
                newY = nodes[0].getY();
            _.each(nodes, function (node) {
                node.updatePoint(newX, newY);
                affectedTerritories = affectedTerritories.concat(node.territories);
            });

            _.each(affectedTerritories, function (territory) {
                territory.displayInfo.path = uniquePath(territory.displayInfo.path);
            });
            this.updateNodes();
        },

        /**
         * Inserts a new node between two selected nodes
         * Adds a new path element in every territory that contains both nodes
         * @param nodes
         */
        split: function (nodes) {
            if (nodes.length !== 2) {
                throw "Can only split exactly two nodes";
            }
            var first = nodes[0];
            var second = nodes[1];
            var newX = (first.getX() + second.getX()) / 2;
            var newY = (first.getY() + second.getY()) / 2;

            var affectedTerritories = _.intersection(first.territories, second.territories);
            _.each(affectedTerritories, function (t) {
                var info = t.displayInfo;
                var firstIndex = _.findIndex(info.path, function (point) {
                    return first.atPoint(point);
                });
                var secondIndex = _.findIndex(info.path, function (point) {
                    return second.atPoint(point);
                });
                var insertAfterFirst = (firstIndex < secondIndex &&
                    !(firstIndex === 0 && secondIndex === info.path.length - 1)) ||
                    (secondIndex === 0 && firstIndex === info.path.length - 1);
                var insertAfter = insertAfterFirst ? firstIndex : secondIndex;
                info.path.splice(insertAfter + 1, 0, [newX, newY]);
            });
            this.updateNodes();
        },

        getNodes: function () {
            var editor = this;
            return _.map(this.nodes, function (node) {
                node.selected = _.contains(editor.selectedNodes(), node);
                return node;
            });
        },
        createNodes: function createNodes (territories) {
            var nodes = [], path;
            function nodeAtPoint(point) {
                return _.find(nodes, function (node) {
                    return node.atPoint(point);
                });
            }
            _.each(territories, function (territory) {
                path = territory.displayInfo.path;
                if (!_.isArray(path)) throw "No path provided for territory " + territory.displayName;
                var previousNode;
                _.each(path, function (point) {
                    var correspondingNode = nodeAtPoint(point);
                    if (!correspondingNode) {
                        correspondingNode = new Node(point);
                        nodes.push(correspondingNode);
                    }
                    correspondingNode.addReference(point, territory);

                    if (previousNode) {
                        correspondingNode.addNeighbour(previousNode);
                    }
                    previousNode = correspondingNode;
                });
                if (path.length > 1) {
                    var head = nodeAtPoint(path[0]);
                    var last = nodeAtPoint(path[path.length-1]);
                    last.addNeighbour(head);
                }
            });
            return nodes;
        },

        update: function (newInfo) {
            newInfo = newInfo || {};
            var dirty = false;
            if (newInfo.territories) {
                this.territories = newInfo.territories;
                dirty = true;
            }
            if (dirty) {
                this.silentUpdate();
            }
        },

        silentUpdate: function () {
            var that = this,
                newSelectedNodes = [];
            this.nodes = this.createNodes(this.territories);

            // all the selected nodes no longer match the list of nodes
            // Update the selected nodes
            _.each(this.selectedNodes(), function (node) {
                var foundNode = _.find(that.nodes, function (newNode) {
                    return newNode.atPoint([node.getX(), node.getY()]);
                });
                if (foundNode && !_.contains(newSelectedNodes, foundNode)) {
                    newSelectedNodes.push(foundNode);
                }
            });
            this.selectedNodes(newSelectedNodes);
        },

        updateNodes: function () {
            this.silentUpdate();
            this.trigger("change");
        },

        assertNodeValidity: function (node) {
            if (!_.contains(this.nodes, node)) {
                throw "Invalid node in NodeEditor"
            }
        },

        selectNode: function (node) {
            this.selectedNodes.push(node);
        },

        deselectNode: function (node) {
            var filtered = _.filter(this.selectedNodes(), function (n) {
                return n != node;
            });
            this.selectedNodes(filtered);
        },

        onNodeClick: function (node) {
            this.assertNodeValidity(node);
            if (_.contains(this.selectedNodes(), node)) {
                this.deselectNode(node);
            } else {
                this.selectNode(node);
            }
            this.trigger("change:selection");
        },

        onNodeDrag: function (node, newX, newY) {
            node.updatePoint(newX, newY);
        }
    });
    _.extend(NodeEditor.prototype, backbone.Events);

    return {
        NodeEditor: NodeEditor,
        Node: Node
    }
});