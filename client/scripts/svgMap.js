define(["lib/d3", "underscore", "backbone"],
function(d3, _, backbone) {
    var Map = function(mapInfo, appendTo) {
        this.territories = mapInfo.territories;

        this.mapElement = d3.select(appendTo)
            .append("svg")
            .style("padding", "100px")
            .style("margin-left", "100px")
            .style("border", "black solid");

        return this;
    };
    var proto = Map.prototype;
    _.extend(proto, backbone.Events);

    proto.drawMap = function() {
        this.drawTerritories();
        this.drawCircles();
        this.drawNames();
    };

    proto.drawTerritories = function () {
        var map = this;
        var territories = this.mapElement.selectAll("path")
            .data(this.territories);

        territories.enter().append("path")
            .attr("d", function(data) {
                return data.displayInfo.path;
            })
            .on("click", function(data){
                map.trigger("territoryClick", data.name);
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
                map.trigger("circleClick", data.name);
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
                map.trigger("territoryClick", data.name);
            });

        nameLabels.exit().remove();
    };

    var testInfo = {
        territories: [
            {
                name: "uniqueName",
                displayName: "Display Name",
                income: 5,
                displayInfo: {
                    path: "M0,0 L100,0 L100,100 L0,100 z",
                    name: {
                        x: 50,
                        y: 50
                    },
                    circle: {
                        x: 80,
                        y: 20
                    }
                }
            }
        ]
    };

    var thing = new Map(testInfo, document.body);
    thing.drawMap();
    thing.on("territoryClick", function() {
        console.log(arguments);
    })
    thing.on("circleClick", function() {
        console.log(arguments);
    })
});