define(["lib/d3", "underscore", "backbone", "knockout"],
function (d3, _, backbone, ko) {

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
        selectedNodes: [],
        nodes: [],
        initialize: function (options) {
            var editor = this;
            this.territories = options.territories;
            this.nodes = this.createNodes(this.territories);
            this.viewModel = {
                selectedNodes: ko.observableArray(),

                removeNodes: function () {
                    editor.remove(editor.selectedNodes)
                },

                mergeNodes: function () {
                    editor.merge(editor.selectedNodes)
                },

                canJoin: ko.computed(function () {
                    console.log(editor.selectedNodes)
                    return;
                }),
                canSplit: ko.computed(function () {
                    return;
                })
            };
            window.viewModel = this.viewModel;
        },

        render: function () {
            // draw buttons
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
            this.nodes = this.createNodes(this.territories);
            this.trigger("change");
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
                territory.displayInfo.path = _.unique(territory.displayInfo.path);
            });
            this.nodes = this.createNodes(this.territories);
            this.trigger("change");
        },
        split: function (nodes) {

        },

        getNodes: function () {
            var editor = this;
            return _.map(this.nodes, function (node) {
                node.selected = _.contains(editor.selectedNodes, node);
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

        assertNodeValidity: function (node) {
            if (!_.contains(this.nodes, node)) {
                throw "Invalid node in NodeEditor"
            }
        },

        selectNode: function (node) {
            this.selectedNodes.push(node);
        },

        deselectNode: function (node) {
            this.selectedNodes = _.filter(this.selectedNodes, function (n) {
                return n != node;
            })
        },

        onNodeClick: function (node) {
            this.assertNodeValidity(node);
            if (_.contains(this.selectedNodes, node)) {
                this.deselectNode(node);
            } else {
                this.selectNode(node);
            }
            this.trigger("change");
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