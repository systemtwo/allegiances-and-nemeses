define(["lib/d3", "underscore", "backbone"],
function(d3, _, backbone) {
    function orElse(value, backup) {
        return _.isUndefined(value) ? backup : value;
    }
    var Map = function(mapInfo, appendTo) {
        var map = this;
        this.parse(mapInfo);

        this.mapElement = d3.select(appendTo)
            .append("svg")
            .style("padding", "100px")
            .style("margin-left", "100px")
            .style("border", "black solid")
            .on("click", function(){
                map.trigger("click")
            });

        return this;
    };
    var proto = Map.prototype;
    _.extend(proto, backbone.Events);

    proto.parse = function(mapInfo) {
        var map = this;
        this.territories = mapInfo.territories || this.territories || [];

        if (mapInfo.connections) {
            this.connections = _.map(mapInfo.connections, function (pair) {
                return _.map(pair, function(maybeTerritory) {
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
        this.showConnections = orElse(mapInfo.showConnections, this.showConnections || false);
    };

    proto.update = function(mapInfo) {
        this.parse(mapInfo);
        this.drawMap();
    };

    proto.drawMap = function() {
        this.drawTerritories();
        this.drawCircles();
        this.drawNames();
        this.drawConnections(this.connections);
    };

    proto.drawTerritories = function () {
        var map = this;
        var territories = this.mapElement.selectAll("path")
            .data(this.territories);

        territories.enter().append("path")
            .attr("d", function(data) {

                var corePath = _.map(data.displayInfo.path, function(points) {
                    return points.join(",");
                }).join(" L");

                return "M" + corePath + " z";
            })
            .on("click", function(data){
                map.trigger("click:territory", data.name);
            });

        territories.exit().remove();

        territories
            .attr("fill", "#ab7");
    };

    proto.drawCircles = function() {
        var map = this;
        var circleInfo = _.map(this.territories, function(t){
            return {
                name: t.name,
                x: t.displayInfo.circle.x,
                y: t.displayInfo.circle.y
            }
        });
        var circles = this.mapElement.selectAll("circle")
            .data(circleInfo);

        circles.enter().append("circle")
            .attr("r", 10)
            .attr("cx", function(data) { return data.x; })
            .attr("cy", function(data) { return data.y; })
            .on("click", function(data){
                map.trigger("click:circle", data.name);
            });

        circles.exit().remove();

        circles
            .attr("fill", "#3e3")
    };

    proto.drawNames = function() {
        var map = this;
        var data = _.map(this.territories, function(territoryInfo) {
            return {
                name: territoryInfo.name,
                displayName: territoryInfo.displayName,
                x: territoryInfo.displayInfo.name.x,
                y: territoryInfo.displayInfo.name.y
            }
        });
        var nameLabels = this.mapElement.selectAll("text")
            .data(data);

        nameLabels.enter().append("text")
            .text(function(d) {return d.displayName})
            .attr("x", function(data) { return data.x; })
            .attr("y", function(data) { return data.y; })
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .on("click", function(data){
                map.trigger("click:territory", data.name);
            });

        nameLabels.exit().remove();
    };

    proto.drawConnections = function(connections) {
        var connectionData = _.map(connections, function(pair) {
            return {
                x1: pair[1].displayInfo.name.x,
                x2: pair[0].displayInfo.name.x,
                y1: pair[1].displayInfo.name.y,
                y2: pair[0].displayInfo.name.y
            }
        });
        var lines = this.mapElement.selectAll(".connection")
            .data(connectionData);

        lines.enter().append("line")
            .classed("connection", true)
            .attr("stroke", "cyan");

        lines
            .style("display", this.showConnections ? "" : "none")
            .attr("x1", function(d){return d.x1})
            .attr("x2", function(d){return d.x2})
            .attr("y1", function(d){return d.y1})
            .attr("y2", function(d){return d.y2})


        lines.exit().remove();
    };

    return {
        Map: Map
    }
});