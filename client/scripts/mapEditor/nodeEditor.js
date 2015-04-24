define(["lib/d3", "underscore", "backbone"],
function (d3, _, backbone) {

    var Node = function (point) {
        this.point = {
            x: point[0],
            y: point[1]
        };
        this.references = [point];
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
    Node.prototype.addReference = function (newPoint) {
        var node = this;
        if (!node.atPoint(newPoint)) {
            console.error("Trying to add non-corresponding point");
            return;
        }

        this.references.push(newPoint);
    };
    Node.prototype.atPoint = function(point) {
        var node = this;
        return node.point.x == point[0] && node.point.y == point[1];
    };

    var NodeEditor = backbone.View.extend({
        selectedNodes: [],
        nodes: [],
        initialize: function (options) {
            this.nodes = this.createNodes(options.territories)
        },
        getNodes: function () {
            return this.nodes.slice();
        },
        createNodes: function createNodes (territories) {
            var nodes = [], path;
            _.each(territories, function (territory) {
                path = territory.displayInfo.path;
                if (!_.isArray(path)) throw "No path provided for territory " + territory.displayName;
                _.each(path, function (point) {
                    var correspondingNode = _.find(nodes, function (node) {
                        return node.atPoint(point);
                    });
                    if (correspondingNode) {
                        correspondingNode.addReference(point);
                    } else {
                        nodes.push(new Node(point));
                    }
                })
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

        onNodeClick: function (node, element) {
            var nodeElement = d3.select(element),
                selectedFlag;
            this.assertNodeValidity(node);
            if (_.contains(this.selectedNodes, node)) {
                selectedFlag = false;
                this.deselectNode(node);
            } else {
                selectedFlag = true;
                this.selectNode(node);
            }
            nodeElement.classed("selected-node", selectedFlag)
        },

        onNodeDrag: function (node, newX, newY) {
            node.updatePoint(newX, newY);
        }
    });

    return {
        NodeEditor: NodeEditor,
        Node: Node
    }
});