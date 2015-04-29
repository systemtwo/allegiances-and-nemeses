define(["lib/d3", "mapEditor/svgMapEditor", "underscore", "message", "territoryEditor", "mapEditor/nodeEditor"],
function (d3, _svgMapEditor, _, msg, TerritoryEditorView, _nodeEditor) {

    // Local namespace
    var mapData = {
        territories: [],
        connections: [],
        showConnections: true
    };
    var svgMap = null;
    var territoryEditorView = new TerritoryEditorView({
        el: $("#editTerritoryPanel")
    });

    setCurrentTerritory(null);
    var modes = {
        CONNECT: "connect",
        BROWSE: "doNothing"
    };
    var currentMode = modes.BROWSE;

    function bindButtons () {
        $("#connectButton").click(function (){
            svgMap.setSelectableTerritories(mapData.territories);
            currentMode = modes.CONNECT;
            setCurrentTerritory(null);
            connectionStart = null;
            secondClick = false;
        });
        $("#browseButton").click(function (){
            svgMap.setSelectableTerritories(mapData.territories);
            currentMode = modes.BROWSE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#save").click(function (){
            $.post("/modules/" + mapData.moduleName, JSON.stringify(getMapDataTransferObject()))
        });
        $("#getJSONButton").click(function (){
            console.log(getMapDataTransferObject());
        });
    }

    function initialize (moduleInfo) {
        var nodeEditor;
        _.each(["territories", "countries", "connections", "moduleName"], function (parameter) {
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

        mapData.connections = JSON.parse(moduleInfo.connections).map(function (c) {
            var first = _.find(mapData.territories, {name: c[0]});
            var second = _.find(mapData.territories, {name: c[1]});
            return [first, second];
        });

        territoryEditorView.update({
            countryList: mapData.countries
        });
        territoryEditorView.render();

        nodeEditor = new _nodeEditor.NodeEditor({
            el: $(".node-editor-section"),
            territories: mapData.territories
        });
        svgMap = new _svgMapEditor.MapEditor(mapData, ".map-holder");
        svgMap.update({
            showConnections: true,
            nodes: nodeEditor.getNodes()
        });
        svgMap.drawMap();
        nodeEditor.render();

        svgMap.on("click:territory", function (territoryName) {
            var territory = _.findWhere(mapData.territories, {name: territoryName});
            territoryClick(territory);
        });
        svgMap.on("click:nothing", function () {
            territoryClick(null);
        });
        svgMap.on("drag:node", function (node, newX, newY) {
            nodeEditor.onNodeDrag(node, newX, newY);
            svgMap.drawTerritories();
        });
        svgMap.on("click:node", function (node, element) {
            nodeEditor.onNodeClick(node, element);
        });
        nodeEditor.on("change", function () {
            svgMap.update({
                nodes: nodeEditor.getNodes()
            })
        });

        bindButtons();
        svgMap.setSelectableTerritories(mapData.territories);
    }

    function territoriesEqual (territory, other) {
        var nameA = _.isString(territory) ? territory : territory.name;
        var nameB = _.isString(other) ? other : other.name;

        return nameA === nameB;
    }

    /**
     * Adds connection if does not exist, or removes an existing connection
     * @param territory
     * @param other
     */
    function connect (territory, other) {
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

    function removeConnection (connection) {
        var numConnections = mapData.connections.length;
        mapData.connections = _.filter(mapData.connections, function (pair) {
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
    function territoryClick (territory) {
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
                    svgMap.setSelectableTerritories(mapData.territories);
                } else {
                    //_r.showArrowFrom(t);
                    connectionStart = territory;
                    svgMap.setSelectableTerritories(_.filter(mapData.territories, function (t) {
                        return t != territory;
                    }))
                }
            } else {
                connectionStart = null;
                svgMap.setSelectableTerritories(mapData.territories);
                //_r.hideArrow();
            }
        }
        //_r.drawMap();
    }

    function setCurrentTerritory (t) {
        territoryEditorView.update({
            territory: t
        });
    }

    function getMapDataTransferObject () {
        return {
            territories: mapData.territories.map(function (t) {
                if (t.type == "sea") {
                    var copiedTerritory = jQuery.extend({}, t);
                    // sea zones don't produce and can't be owned
                    delete copiedTerritory.country;
                    delete copiedTerritory.income;
                    return copiedTerritory;
                } else {
                    return t;
                }
            }),
            connections: mapData.connections.map(function (c) {
                return [c[0].name, c[1].name].sort(); // sort them for consistency
            })
        };
    }

    return {
        initialize: initialize
    }
});