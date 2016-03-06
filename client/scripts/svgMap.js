define(["lib/d3", "underscore", "backbone"],
function (d3, _, backbone) {
    var Map = function (mapInfo, appendTo) {
        var map = this;
        this.territories = [];
        this.countries = [];
        this.selectableTerritories = [];
        this.parse(mapInfo);

        this.mapElement = d3.select(appendTo)
            .append("svg")
            .style("border", "black solid")
            .classed("svg-map", true)
            .on("click", map.onMapClick.bind(map));

        this.container = this.mapElement.append("g")
            .classed("map-element-container", true);

        this.stencilImageContainer = this.container.append("g").append("image");

        map.selectorBox = map.mapElement.append("rect")
            .classed("selector-box", true);

        this.territoryContainer = this.container.append("g")
            .classed("connections-container", true);

        this.enableZoom();
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

    proto.getCountryColor = function (country, selectable) {
        country = _.isString(country) ? _.findWhere(this.countries, {name: country}) : country;
        if (country) {
            return selectable && country.selectableColor ? country.selectableColor : country.color;
        } else {
            return selectable ? "#33c" : "#44d"; // blue
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

    proto.getCircleContent = function (territory) {
        return "";
    };

    proto.isCircleVisible = function (territory) {
        return true;
    };

    proto.attachPath = function (territoryGroups) {
        var map = this;
        territoryGroups.append("path")
            .classed("territory", true)
            .on("click", map.onTerritoryClick.bind(map));
    };

    proto.attachCircle = function (territoryGroups) {
        var map = this;
        var circleGroup = territoryGroups.append("g")
            .classed("unit-selector-group", true);
        circleGroup.append("circle")
            .classed("unit-selector", true)
            .attr("r", 10)
            .on("click", map.onCircleClick.bind(map));
        circleGroup.append("text")
            .classed("circle-content", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .on("click", map.onCircleClick.bind(map));
    };

    proto.attachDisplayName = function (territoryGroups) {
        var map = this;
        territoryGroups.append("text")
            .classed("territory-name", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .on("click", map.onTerritoryClick.bind(map));
    };

    proto.attachTerritoryElements = function (territoryGroups) {
        this.attachPath(territoryGroups);
        this.attachCircle(territoryGroups);
        this.attachDisplayName(territoryGroups);
    };

    proto.isSelectable = function (t) {
        return _.contains(this.selectableTerritories, t);
    };

    proto.drawTerritories = function () {
        var map = this;

        // sort territories so that selectable territories are last, but land territories are always on top of seas
        this.territories.sort(function (a, b) {
            // magic sorting by casting boolean to int (0 or 1)
            return (+a.isLand() - b.isLand()) || (+map.isSelectable(a) - map.isSelectable(b));
        });
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
            .attr("fill", function (data) {
                return map.getCountryColor(data.country, map.isSelectable(data))
            });
        territoryGroups.select(".unit-selector-group")
            .attr("visibility", function (d) {return map.isCircleVisible(d) ? "visible" : "hidden"});
        territoryGroups.select(".unit-selector")
            .attr("cx", function (data) { return data.displayInfo.circle.x; })
            .attr("cy", function (data) { return data.displayInfo.circle.y; });
        territoryGroups.select(".circle-content")
            .text(function (d) {return map.getCircleContent(d)})
            .attr("x", function (data) { return data.displayInfo.circle.x; })
            .attr("y", function (data) { return data.displayInfo.circle.y; });
        territoryGroups.select(".territory-name")
            .text(function (d) {return d.displayName})
            .attr("x", function (data) { return data.displayInfo.name.x; })
            .attr("y", function (data) { return data.displayInfo.name.y; });
    };

    proto.onMapClick = function () {
        if (d3.event.defaultPrevented) return; // click suppressed
        var location = d3.mouse(this.container.node());
        this.trigger("click", Math.round(location[0]), Math.round(location[1]));
    };

    proto.onTerritoryClick =  function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        var events = ["click:territory"];
        if (_.contains(this.selectableTerritories, data)) {
            events.push("select:territory")
        }
        this.trigger(events.join(" "), data);
    };

    proto.onCircleClick = function (data){
        if (d3.event.defaultPrevented) return; // click suppressed
        this.trigger("click:circle", data, d3.event);
    };

    var savedScale = 1.0, savedTranslate = [0, 0];
    proto.enableZoom = function () {
        var map = this;
        var zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", function zoomed () {
                savedScale = d3.event.scale;
                savedTranslate = d3.event.translate;
                map.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            });

        if (savedScale) zoom.scale(savedScale);
        if (savedTranslate) zoom.translate(savedTranslate);
        this.mapElement.call(zoom);
    };
    proto.disableZoom = function () {
        this.mapElement.on(".zoom", null);
    };

    function translateAndScale(point) {
        return [(point[0] - savedTranslate[0])/savedScale, (point[1] - savedTranslate[1])/savedScale];
    }
    proto.enableDragSelect = function () {
        var map = this;
        var drag = (function () {
            var dragStart = null;
            return d3.behavior.drag()
                .on("dragstart", function () {
                    dragStart = d3.mouse(this);
                    map.selectorBox
                        .attr("x", dragStart[0])
                        .attr("y", dragStart[1])
                        .classed("active", true);
                })
                .on("drag", function () {
                    d3.event.sourceEvent.stopPropagation();
                    var x = (dragStart[0] > d3.event.x) ? d3.event.x : dragStart[0];
                    var y = (dragStart[1] > d3.event.y) ? d3.event.y : dragStart[1];
                    var width = Math.abs(dragStart[0] - d3.event.x);
                    var height = Math.abs(dragStart[1] - d3.event.y);
                    map.selectorBox
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", width)
                        .attr("height", height)
                })
                .on("dragend", function () {
                    map.selectorBox
                        .classed("active", false)
                        .attr("width", 0)
                        .attr("height", 0);
                    map.trigger("selection", translateAndScale(dragStart), translateAndScale(d3.mouse(this)));
                    dragStart = null;
                });
        })();

        this.mapElement.call(drag);
    };

    proto.disableDragSelect = function () {
        this.mapElement.on(".drag", null);
    };

    return {
        Map: Map
    }
});