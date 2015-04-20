// Start the main app logic.
define(["nunjucks", "svgMap", "underscore", "message", "jquery-ui"],
function(nj, _svg, _, msg) {

    // Local namespace
    var currentTerritory;
    var mapData = {
        territories: [],
        connections: [],
        showConnections: true
    };
    var svgMap = null;

    setCurrentTerritory(null);
    var modes = {
        CREATE: "createTerritory",
        CONNECT: "connect",
        BROWSE: "doNothing"
    };
    var currentMode = modes.BROWSE;

    function bindButtons() {
        $("#createButton").click(function(){
            //_r.setSelectableTerritories([]);
            currentMode = modes.CREATE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#connectButton").click(function(){
            //_r.setSelectableTerritories(territoryCatalogue);
            currentMode = modes.CONNECT;
            setCurrentTerritory(null);
            connectionStart = null;
            secondClick = false;
        });
        $("#browseButton").click(function(){
            //_r.setSelectableTerritories(territoryCatalogue);
            currentMode = modes.BROWSE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#territoryButton").click(function(){
            showTerritoryList();
            secondClick = false;
        });
        $("#save").click(function(){
            $.post("/modules/" + mapData.moduleName, JSON.stringify({
                connections: mapData.connections.map(function (c) {
                    return [c[0].name, c[1].name].sort(); // sort them for consistency
                }),
                territories: mapData.territories
            }))
        });
        $("#getJSONButton").click(function(){
            console.log(getJSON());
        });
    }

    function initialize(moduleInfo) {

        _.each(["territories", "countries", "connections", "moduleName"], function(parameter) {
            if (!moduleInfo[parameter]) {
                msg.log("Missing parameter: " + parameter)
            }
        });

        // NOTE - territories and countries are stored as plain objects for the map editor,
        // and do NOT use the Territory and Country class
        mapData.wrapsHorizontally = moduleInfo.wrapsHorizontally;
        mapData.territories = JSON.parse(moduleInfo.territories);

        mapData.countries = JSON.parse(moduleInfo.countries);

        mapData.moduleName = moduleInfo.moduleName;

        mapData.connections = JSON.parse(moduleInfo.connections).map(function(c) {
            var first = _.find(mapData.territories, {name: c[0]});
            var second = _.find(mapData.territories, {name: c[1]});
            return [first, second];
        });

        svgMap = new _svg.Map(mapData, ".map-holder");
        svgMap.update({showConnections: true});
        svgMap.drawMap();
        svgMap.on("click:territory", function(territoryName) {
            var territory = _.findWhere(mapData.territories, {name: territoryName});
            territoryClick(territory);
        });
        svgMap.on("click:nothing", function() {
            territoryClick(null);
        });

        bindButtons();
        //_r.setSelectableTerritories(territoryCatalogue);
    }

    function territoriesEqual(territory, other) {
        var nameA = _.isString(territory) ? territory : territory.name;
        var nameB = _.isString(other) ? other : other.name;

        return nameA === nameB;
    }

    /**
     * Adds connection if does not exist, or removes an existing connection
     * @param territory
     * @param other
     */
    function connect(territory, other) {
        if (territoriesEqual(territory, other)) {
            msg.log("Cannot connect identical territories");
            return false;
        }
        var connection = [territory, other];
        // remove it from the connections list, if it exists
        var removed = removeConnection(connection);

        // Nothing was removed we add the new connection
        if (!removed) {
            mapData.connections.push(connection);
            msg.log("Added connection")
        }

        svgMap.update({
            connections: mapData.connections
        })
    }

    function removeConnection(connection) {
        var numConnections = mapData.connections.length;
        mapData.connections = _.filter(mapData.connections, function(pair) {
            return !((territoriesEqual(pair[0], connection[0]) && territoriesEqual(pair[1], connection[1])) ||
                    (territoriesEqual(pair[1], connection[0]) && territoriesEqual(pair[0], connection[1])));
        });

        // filtered length is the same, so nothing was removed
        var removedConnection = numConnections !== mapData.connections.length;
        if (removedConnection) {
            msg.log("Removed connection, remaining length: " + mapData.connections.length)
        }
        return removedConnection;
    }

    var secondClick = false, firstClick = {}, connectionStart = null;
    // Override the click handler on the canvas element with this function, when in map editor mode
    function territoryClick(territory) {
        if (currentMode == modes.BROWSE) {
            if (territory) {
                setCurrentTerritory(territory);
            }
        } else if (currentMode == modes.CONNECT) {
            if (territory) {
                if (connectionStart && connectionStart!==territory) {
                    connect(territory, connectionStart);
                    connectionStart = null;
                    //_r.hideArrow();
                } else {
                    //_r.showArrowFrom(t);
                    connectionStart = territory;
                }
            } else {
                connectionStart = null;
                //_r.hideArrow();
            }
        }
        //_r.drawMap();
    }
    function showTerritoryList() {
        var windowContents = $(nj.render( "/static/templates/tList.html", {territories: mapData.territories}));

        windowContents.find(".territoryRow").click(function() {
            var name = $(this).data("name");
            var matchingTerritory = _.findWhere(mapData.territories, {name: name});
            selectTerritory(matchingTerritory);
            //_r.setSelectableTerritories(territoryCatalogue);
            windowContents.dialog("close");
        }).css("cursor", "pointer");

        windowContents.dialog({
            title: "Territories - Click to Edit",
            modal: false,
            width: 600,
            dialogClass: "no-close-button",
            height: Math.min(500, window.innerHeight),
            buttons: {
                "Close": function () {
                    $(this).dialog("close");
                }
            }
        })
    }

    function selectTerritory (t){
        setCurrentTerritory(t);
        currentMode = modes.BROWSE;
        //_r.setSelectableTerritories([]);
    }

    function setCurrentTerritory(t) {
        currentTerritory = t;
        if (t === null) {
            $("#editTerritoryPanel").empty().hide();
        } else {
            var contents = $(nj.render("static/templates/editTerritory.html", {territory: t, countries: mapData.countries}));
            $("#editTerritoryPanel").show().html(contents);
            var onChange = function(){
                // Save the territory
                var array = $("#editTerritoryForm").serializeArray();
                var type = "land";
                array.forEach(function(attribute) {
                    if (attribute.name == "type") {
                        type = attribute.value;
                        return;
                    }
                    t[attribute.name] = attribute.value;
                });

                // 'type' checkbox does not appear in array if deselected, so must be land if 'type' not present
                var changed = t.type !== type;
                t.type = type;
                if (changed) {
                    setCurrentTerritory(t); // force rerender
                }
            };
            contents.find("input").change(onChange);
            contents.find("select").change(onChange);
        }
    }

    function getJSON() {
        return {
            territories: JSON.stringify(mapData.territories.map(function(t) {
                if (t.type == "sea") {
                    var copiedTerritory = jQuery.extend({}, t);
                    // sea zones don't produce and can't be owned
                    delete copiedTerritory.country;
                    delete copiedTerritory.income;
                    return copiedTerritory;
                } else {
                    return t;
                }
            })),
            connections: JSON.stringify(mapData.connections.map(function (c) {return [c[0].name, c[1].name]}))
        };
    }

    return {
        initialize: initialize
    }
});