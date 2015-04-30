define(["lib/d3", "underscore", "backbone", "svgMap"],
function (d3, _, backbone, svgMap) {
    var MapEditor = function(mapInfo, appendTo) {
        this.nodes = [];
        this.showConnections = false;
        this.connections = [];
        svgMap.Map.call(this, mapInfo, appendTo);
        this.mapElement.on("dblclick.zoom", null);
        this.nodesContainer = this.container.append("g")
            .classed("nodes-container", true);
        this.connectionsContainer = this.container.append("g")
            .classed("connections-container", true);
    };
    // Extend the prototype
    var parent = svgMap.Map.prototype;
    MapEditor.prototype = Object.create(parent);
    MapEditor.prototype.parse = function (mapInfo) {
        var map = this;
        parent.parse.call(this, mapInfo);
        if (_.isArray(mapInfo.connections)) {
            this.connections = _.map(mapInfo.connections, function (pair) {
                return _.map(pair, function (maybeTerritory) {
                    if (_.contains(map.territories, maybeTerritory)) {
                        return maybeTerritory;
                    } else {
                        var findTerritory = _.findWhere(map.territories, {name: maybeTerritory});
                        if (findTerritory) {
                            return findTerritory;
                        } else {
                            throw "Could not find territory for " + maybeTerritory;
                        }
                    }
                })
            });
        }

        // update if passed in, otherwise keep same value or default to false
        if (!_.isUndefined(mapInfo.showConnections)) {
            this.showConnections = mapInfo.showConnections;
        }
        if (_.isArray(mapInfo.nodes)) {
            this.nodes = mapInfo.nodes;
        }
    };
    MapEditor.prototype.attachDisplayName = function (territoryGroups) {
        territoryGroups.append("text")
            .classed("territory-name", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle");
    };
    MapEditor.prototype.drawMap = function () {
        this.drawTerritories();
        this.drawConnections();
        this.drawNodes();
        this.addDragEvents();
    };
    MapEditor.prototype.drawConnections = function () {
        var connectionData = _.map(this.connections, function (pair) {
            return {
                x1: pair[1].displayInfo.name.x,
                x2: pair[0].displayInfo.name.x,
                y1: pair[1].displayInfo.name.y,
                y2: pair[0].displayInfo.name.y
            }
        });
        var lines = this.connectionsContainer.selectAll(".connection")
            .data(connectionData);

        lines.enter().append("line")
            .classed("connection", true)
            .attr("stroke", "cyan");

        lines
            .style("display", this.showConnections ? "" : "none")
            .attr("x1", function (d){return d.x1})
            .attr("x2", function (d){return d.x2})
            .attr("y1", function (d){return d.y1})
            .attr("y2", function (d){return d.y2});

        lines.exit().remove();
    };
    MapEditor.prototype.drawNodes = function () {
        var map = this;
        var nodeElements = this.nodesContainer.selectAll(".node")
            .data(this.nodes);

        nodeElements.enter().append("circle")
            .classed("node", true)
            .attr("r", 5);

        nodeElements
            .classed("selected-node", function (d) { return d.selected })
            .attr("cx", function (d) { return d.getX(); })
            .attr("cy", function (d) { return d.getY(); })
            .on("click", function (node) {
                map.onNodeClick(node, this);
            });

        nodeElements.exit().remove();
    };

    MapEditor.prototype.addDragEvents = function () {
        var map = this;
        function createDragBehavior (origin, onDrag) {
            return d3.behavior.drag()
                .origin(origin)
                .on("dragstart", dragstarted)
                .on("drag", onDrag)
                .on("dragend", dragended);
        }
        function getCircleOrigin() {
            var element = d3.select(this);
            return {
                x: element.attr("cx"),
                y: element.attr("cy")
            };
        }
        function getOrigin() {
            var element = d3.select(this);
            return {
                x: element.attr("x"),
                y: element.attr("y")
            };
        }
        function dragNode (element) {
            d3.select(this)
                .attr("cx", d3.event.x)
                .attr("cy", d3.event.y);
            map.trigger("drag:node", element, d3.event.x, d3.event.y);
        }
        function dragCircle (element) {
            d3.select(this)
                .attr("cx", d3.event.x)
                .attr("cy", d3.event.y);
            map.trigger("drag:circle", element, d3.event.x, d3.event.y);
        }
        function dragName (element) {
            d3.select(this)
                .attr("x", d3.event.x)
                .attr("y", d3.event.y);
            map.trigger("drag:name", element, d3.event.x, d3.event.y);
        }

        var nodeDrag = createDragBehavior(getCircleOrigin, dragNode);
        var nameDrag = createDragBehavior(getOrigin, dragName);
        var circleDrag = createDragBehavior(getCircleOrigin, dragCircle);
        this.nodesContainer.selectAll(".node").call(nodeDrag);
        this.territoryContainer.selectAll(".territory-group .territory-name").call(nameDrag);
        this.territoryContainer.selectAll(".territory-group .unit-selector").call(circleDrag);
    };
    MapEditor.prototype.onNodeClick = function (node, element) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d3.event.stopPropagation();
        this.trigger("click:node", node, element);
    };

    // Default event handlers
    function dragstarted () {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
    }
    function dragended () {
        d3.select(this).classed("dragging", false);
    }

    return {
        MapEditor: MapEditor
    }
});