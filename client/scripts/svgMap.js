define(["lib/d3", "underscore", "backbone"],
function (d3, _, backbone) {
    var Map = function (mapInfo, appendTo) {
        var map = this;
        var zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", function zoomed () {
              map.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            });
        this.showConnections = false;
        this.connections = [];
        this.territories = [];
        this.selectableTerritories = [];
        this.nodes = [];
        this.parse(mapInfo);

        this.mapElement = d3.select(appendTo)
            .append("svg")
            .style("border", "black solid")
            .classed("svg-map", true)
            .on("click", map.onMapClick.bind(map))
            .call(zoom);

        this.container = this.mapElement.append("g")
            .classed("map-element-container", true);

        this.territoryContainer = this.container.append("g")
            .classed("connections-container", true);
        this.connectionsContainer = this.container.append("g")
            .classed("connections-container", true);
        this.nodesContainer = this.container.append("g")
            .classed("nodes-container", true);

        return this;
    };
    var proto = Map.prototype;
    _.extend(proto, backbone.Events);

    proto.parse = function (mapInfo) {
        var map = this;
        if (_.isArray(mapInfo.territories)) {
            this.territories = mapInfo.territories;
        }

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
        
        if (_.isArray(mapInfo.nodes)) {
            this.nodes = mapInfo.nodes;
        }
        
        // update if passed in, otherwise keep same value or default to false
        if (!_.isUndefined(mapInfo.showConnections)) {
            this.showConnections = mapInfo.showConnections;
        }
    };

    proto.setSelectableTerritories = function (territories) {
        this.selectableTerritories = territories;
        this.drawMap();
    };

    proto.update = function (mapInfo) {
        this.parse(mapInfo);
        this.drawMap();
    };

    proto.drawMap = function () {
        this.drawTerritories();
        this.drawConnections();
        this.drawNodes();
    };

    proto.drawTerritories = function () {
        var map = this;
        var territoryGroups = this.territoryContainer.selectAll(".territory-group")
            .data(this.territories);

        territoryGroups.exit().remove();

        var newTerritories = territoryGroups.enter().append("g")
            .classed("territory-group", true);
        newTerritories.append("path")
            .classed("territory", true)
            .on("click", map.onTerritoryClick.bind(map));
        newTerritories.append("circle")
            .classed("unit-selector", true)
            .attr("r", 10)
            .on("click", map.onCircleClick.bind(map));
        newTerritories.append("text")
            .classed("territory-name", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle");


        territoryGroups
            .classed("selectable", function (data){
                return _.contains(map.selectableTerritories, data)
            });

        territoryGroups.select(".territory")
            .attr("d", function (data) {
                var corePath = _.map(data.displayInfo.path, function (points) {
                    return points.join(",");
                }).join(" L");

                return "M" + corePath + " z";
            });
        territoryGroups.select(".unit-selector")
            .attr("cx", function (data) { return data.displayInfo.circle.x; })
            .attr("cy", function (data) { return data.displayInfo.circle.y; });
        territoryGroups.select(".territory-name")
            .text(function (d) {return d.displayName})
            .attr("x", function (data) { return data.displayInfo.name.x; })
            .attr("y", function (data) { return data.displayInfo.name.y; })
            .on("click", map.onTerritoryClick.bind(map));
    };
    proto.drawConnections = function () {
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
    
    proto.drawNodes = function () {
        var map = this;
        var drag = d3.behavior.drag()
            .origin(function(node) {
                return {
                    x: node.getX(),
                    y: node.getY()
                };
            })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        var nodeElements = this.nodesContainer.selectAll(".node")
            .data(this.nodes);

        nodeElements.enter().append("circle")
            .classed("node", true)
            .attr("r", 5)
            .call(drag);

        nodeElements
            .attr("cx", function (d) { return d.getX(); })
            .attr("cy", function (d) { return d.getY(); });

        nodeElements.exit().remove();

        function dragstarted() {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function dragged(node) {
            node.updatePoint(d3.event.x, d3.event.y);
            d3.select(this)
                .attr("cx", node.getX())
                .attr("cy", node.getY());
            map.drawTerritories();
        }

        function dragended() {
            d3.select(this).classed("dragging", false);
        }
    };

    proto.onMapClick = function () {
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click");
    };

    proto.onTerritoryClick =  function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click:territory", data.name);
    };

    proto.onCircleClick = function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click:circle", data.name);
    };

    return {
        Map: Map
    }
});