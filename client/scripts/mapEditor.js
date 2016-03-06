define(["lib/d3",
        "mapEditor/svgMapEditor",
        "mapEditor/unitSetup",
        "mapEditor/editUnitCatalogue",
        "underscore",
        "message",
        "territoryEditor",
        "mapEditor/nodeEditor",
        "components",
        "lib/mousetrap",
        "lib/ko.extensions"],
function (d3, _svgMapEditor, UnitSetupView, UnitCatalogueView, _, msg, TerritoryEditorView, _nodeEditor, _c, Mousetrap) {
    // Local namespace
    var mapData = {
        territories: [],
        connections: [],
        showConnections: true,
        unitCatalogue: {},
        countries: []
    };
    var svgMap = null;
    var nodeEditor;
    var territoryEditorView = new TerritoryEditorView({
        el: $("#editTerritoryPanel")
    });
    var newTerritory = null;
    function newTerritoryPoint (point) {
        if (newTerritory == null) {
            newTerritory = _c.Territory.createNew(point);
            mapData.territories.push(newTerritory);
        }
        newTerritory.displayInfo.path.push(point);
        nodeEditor.update({
            territories: mapData.territories
        });
        svgMap.update({
            nodes: nodeEditor.getNodes()
        });
    }

    setCurrentTerritory(null);
    var modes = {
        CONNECT: "connect",
        BROWSE: "doNothing",
        CREATE: "create"
    };
    var selectionMode = "add";
    var currentMode = modes.BROWSE;
    var connectionStart = null;
    function enableConnect (){
        svgMap.setSelectableTerritories(mapData.territories);
        currentMode = modes.CONNECT;
        setCurrentTerritory(null);
        connectionStart = null;
    }
    function browse (){
        svgMap.setSelectableTerritories(mapData.territories);
        currentMode = modes.BROWSE;
        setCurrentTerritory(null);
    }
    function enableCreation (){
        svgMap.setSelectableTerritories([]);
        currentMode = modes.CREATE;
        setCurrentTerritory(null);
        newTerritory = null;
        _.each(nodeEditor.selectedNodes(), function (node) {
            newTerritoryPoint([node.getX(), node.getY()])
        })
    }
    function editUnits (){
        var editUnitWindow = new UnitCatalogueView(mapData.unitCatalogue, mapData.countries);
        editUnitWindow.render();
    }
    function saveJSON (){
        $.post("/modules/" + mapData.moduleName, JSON.stringify(getMapDataTransferObject()))
    }

    function bindButtons () {
        $("#connectButton").click(enableConnect);
        $("#browseButton").click(browse);
        $("#createButton").click(enableCreation);
        $("#editUnits").click(editUnits);
        $("#save").click(saveJSON);
        $("#getJSONButton").click(function (){
            console.log(getMapDataTransferObject());
        });
    }
    function bindKeys () {
        Mousetrap.bind("ctrl+s", function (e) {
            e.preventDefault();
            saveJSON();
        });
        Mousetrap.bind("esc", function () {
            if (currentMode == modes.CONNECT && connectionStart != null) {
                connectionStart = null;
            } else if (currentMode != currentMode != modes.BROWSE) {
                browse();
            } else if (territoryEditorView.options.territory) {
                setCurrentTerritory(null);
            }
        });
        Mousetrap.bind("shift", function (e) {
            e.preventDefault();
            selectionMode = "add";
            svgMap.enableDragSelect();
            svgMap.disableZoom();
        }, "keydown");
        Mousetrap.bind("alt", function (e) {
            e.preventDefault();
            selectionMode = "subtract";
            svgMap.enableDragSelect();
            svgMap.disableZoom();
        }, "keydown");
        function reenableZoom (e) {
            e.preventDefault();
            svgMap.disableDragSelect();
            svgMap.enableZoom();
        }
        Mousetrap.bind("alt", reenableZoom, "keyup");
        Mousetrap.bind("shift", reenableZoom, "keyup");
        Mousetrap.bind("e", function () {
            editUnits();
        });
        Mousetrap.bind("z", function () {
            enableConnect();
        });
        Mousetrap.bind("b", function () {
            browse();
        });
        Mousetrap.bind("c", function () {
            enableCreation();
        });

        // Node editor bindings
        Mousetrap.bind("d", function () {
            nodeEditor.deselectAllNodes();
            svgMap.update({
                nodes: nodeEditor.getNodes()
            })
        });
        Mousetrap.bind("del", function () {
            nodeEditor.remove(nodeEditor.selectedNodes())
        });
        Mousetrap.bind("s", function () {
            nodeEditor.split(nodeEditor.selectedNodes())
        });
        Mousetrap.bind("a", function () {
            nodeEditor.merge(nodeEditor.selectedNodes())
        });
    }

    function initialize (moduleInfo) {
        _.each(["territories", "countries", "connections", "unitCatalogue", "unitSetup", "moduleName", "metadata"], function (parameter) {
            if (!moduleInfo[parameter]) {
                msg.log("Missing parameter: " + parameter)
            }
        });

        var unitCatalogue = JSON.parse(moduleInfo.unitCatalogue);

        // NOTE - territories and countries are stored as plain objects for the map editor,
        // and do NOT use the Territory and Country class
        mapData.wrapsHorizontally = moduleInfo.wrapsHorizontally;
        mapData.territories = JSON.parse(moduleInfo.territories).map(function (tInfo) {
            return new _c.Territory(tInfo, tInfo.country);
        });
        mapData.countries = JSON.parse(moduleInfo.countries);
        mapData.moduleName = moduleInfo.moduleName;
        mapData.unitSetup = JSON.parse(moduleInfo.unitSetup);
        mapData.unitCatalogue = unitCatalogue;
        mapData.stencilImage = moduleInfo.metadata.stencilImage;

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

        svgMap.on("click:territory", function (territory) {
            territoryClick(territory);
        });
        svgMap.on("click:circle", function (territory) {
            if (!territory.type == "land") {
                // TODO ask for country name
                console.warn("Sea zone setup is unsupported");
                return;
            }
            if (!territory.country) {
                console.warn("No country set for territory");
                return;
            }
            var territoryUnits = mapData.unitSetup[territory.name] || (mapData.unitSetup[territory.name] = []);
            var unitSetupView = new UnitSetupView(territory, territoryUnits, unitCatalogue);
            unitSetupView.render();
        });
        svgMap.on("click", function (x, y) {
            if (currentMode === modes.CREATE) {
                newTerritoryPoint([x, y]);
            }
        });
        svgMap.on("click:nothing", function () {
            territoryClick(null);
        });
        svgMap.on("drag:node", function (node, newX, newY) {
            nodeEditor.onNodeDrag(node, newX, newY);
            svgMap.drawTerritories();
        });
        svgMap.on("drag:name", function (territory, newX, newY) {
            var nameInfo = territory.displayInfo.name;
            nameInfo.x = newX;
            nameInfo.y = newY;
            svgMap.drawConnections();
        });
        svgMap.on("drag:circle", function (territory, newX, newY) {
            var circleInfo = territory.displayInfo.circle;
            circleInfo.x = newX;
            circleInfo.y = newY;
        });
        svgMap.on("click:node", function (node, element) {
            if (currentMode === modes.CREATE) {
                newTerritoryPoint([node.getX(), node.getY()]);
            } else {
                nodeEditor.onNodeClick(node, element);
            }
        });
        svgMap.on("selection", function (startPosition, endPosition) {
            var nodesInBounds = _.filter(nodeEditor.getNodes(), function (node) {
                var x = node.getX(),
                    y = node.getY();

                return x > Math.min(startPosition[0], endPosition[0]) &&
                        x <  Math.max(startPosition[0], endPosition[0]) &&
                        y > Math.min(startPosition[1], endPosition[1]) &&
                        y <  Math.max(startPosition[1], endPosition[1]);
            });
            if (selectionMode === "add") {
                nodeEditor.selectNodes(nodesInBounds);
            } else {
                nodeEditor.deselectNodes(nodesInBounds);
            }
            svgMap.update({
                nodes: nodeEditor.getNodes()
            })
        });
        function editNodesForTerritories (territories) {
            nodeEditor.update({
                territories: territories
            });
            svgMap.update({
                territories: mapData.territories,
                connections: mapData.connections,
                nodes: nodeEditor.getNodes()
            })
        }
        nodeEditor.on("change", function () {
            deleteInvalidTerritories();
            // If some territories have been deleted, need to update the node editor, and the map
            editNodesForTerritories(_.intersection(nodeEditor.territories, mapData.territories));
        });
        nodeEditor.on("change:selection", function () {
            svgMap.update({
                nodes: nodeEditor.getNodes()
            })
        });
        territoryEditorView.on("change", function () {
            svgMap.drawMap();
        });
        territoryEditorView.on("editPath", function (territory) {
            editNodesForTerritories([territory]);
        });
        territoryEditorView.on("endEditPath", function () {
            editNodesForTerritories(mapData.territories);
        });

        bindButtons();
        bindKeys();
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

    function deleteInvalidTerritories () {
        mapData.territories = mapData.territories.filter(function (territory) {
            return territory.displayInfo.path.length > 2;
        });
        mapData.connections = mapData.connections.filter(function (pair) {
            return _.contains(mapData.territories, pair[0]) &&
                _.contains(mapData.territories, pair[1]);
        })
    }

    function getMapDataTransferObject () {
        return {
            territories: mapData.territories.map(function (t) {
                var copiedTerritory = jQuery.extend({}, t);
                delete copiedTerritory.color;
                if (t.type == "sea") {
                    // sea zones don't produce and can't be owned
                    delete copiedTerritory.country;
                    delete copiedTerritory.income;
                    return copiedTerritory;
                } else {
                    copiedTerritory.income = parseFloat(t.income);
                    return copiedTerritory;
                }
            }),
            connections: mapData.connections.map(function (c) {
                return [c[0].name, c[1].name].sort(); // sort them for consistency
            }),
            unitSetup: mapData.unitSetup,
            units: mapData.unitCatalogue
        };
    }

    return {
        initialize: initialize
    }
});