define(["lib/d3", "underscore", "backbone"],
function (d3, _, backbone) {
    var Map = function (mapInfo, appendTo) {
        var map = this;
        var zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", function zoomed () {
              map.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            });
        this.territories = [];
        this.countries = [];
        this.selectableTerritories = [];
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

        return this;
    };
    var proto = Map.prototype;
    _.extend(proto, backbone.Events);

    proto.parse = function (mapInfo) {
        if (_.isArray(mapInfo.territories)) {
            this.territories = mapInfo.territories;
        }
        if (_.isArray(mapInfo.countries)) {
            this.countries = mapInfo.countries;
        }
    };

    proto.getCountryColor = function (country) {
        country = _.isString(country) ? _.findWhere(this.countries, {name: country}) : country;
        if (country) {
            return country.color;
        } else {
            return "#22b"; // blue
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
    };

    proto.attachPath = function (territoryGroups) {
        var map = this;
        territoryGroups.append("path")
            .classed("territory", true)
            .on("click", map.onTerritoryClick.bind(map));
    };

    proto.attachCircle = function (territoryGroups) {
        var map = this;
        territoryGroups.append("circle")
            .classed("unit-selector", true)
            .attr("r", 10)
            .on("click", map.onCircleClick.bind(map));
    };

    proto.attachDisplayName = function (territoryGroups) {
        territoryGroups.append("text")
            .classed("territory-name", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle");
    };

    proto.attachTerritoryElements = function (territoryGroups) {
        this.attachPath(territoryGroups);
        this.attachCircle(territoryGroups);
        this.attachDisplayName(territoryGroups);
    };

    proto.drawTerritories = function () {
        var map = this;
        var territoryGroups = this.territoryContainer.selectAll(".territory-group")
            .data(this.territories);

        territoryGroups.exit().remove();

        var newTerritories = territoryGroups.enter().append("g")
            .classed("territory-group", true);
        this.attachTerritoryElements(newTerritories);

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
            })
            .attr("fill", function (data) { return map.getCountryColor(data.country) });
        territoryGroups.select(".unit-selector")
            .attr("cx", function (data) { return data.displayInfo.circle.x; })
            .attr("cy", function (data) { return data.displayInfo.circle.y; });
        territoryGroups.select(".territory-name")
            .text(function (d) {return d.displayName})
            .attr("x", function (data) { return data.displayInfo.name.x; })
            .attr("y", function (data) { return data.displayInfo.name.y; })
            .on("click", map.onTerritoryClick.bind(map));
    };

    proto.onMapClick = function () {
        if (d3.event.defaultPrevented) return; // click suppressed
        var location = d3.mouse(this.container.node());
        this.trigger("click", Math.round(location[0]), Math.round(location[1]));
    };

    proto.onTerritoryClick =  function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click:territory", data);
    };

    proto.onCircleClick = function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click:circle", data);
    };

    return {
        Map: Map
    }
});