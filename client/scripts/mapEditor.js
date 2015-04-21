// Start the main app logic.
define(["nunjucks", "svgMap", "underscore", "message", "territoryEditor", "jquery-ui"],
function (nj, _svg, _, msg, TerritoryEditorView) {

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
        var nodes;
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

        nodes = createNodes(mapData.territories);

        territoryEditorView.update({
            countryList: mapData.countries
        });
        territoryEditorView.render();

        svgMap = new _svg.Map(mapData, ".map-holder");
        svgMap.update({
            showConnections: true,
            nodes: nodes
        });
        svgMap.drawMap();
        svgMap.on("click:territory", function (territoryName) {
            var territory = _.findWhere(mapData.territories, {name: territoryName});
            territoryClick(territory);
        });
        svgMap.on("click:nothing", function () {
            territoryClick(null);
        });

        bindButtons();
        svgMap.setSelectableTerritories(mapData.territories);
    }

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

    function createNodes (territories) {
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