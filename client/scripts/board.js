define(["backbone", "svgMap", "components", "helpers", "router", "gameAccessor", "phases/phaseHelper"],
function(backbone, svgMap, _c, _helpers, _router, _b, phaseHelper) {
    var Game = function(id, boardInfo, bindTo) {
        var that = this;
        _b.setBoard(this);
        this.id = id;
        // lists of game objects whose properties will change as the game progresses
        this.boardData = {
            countries: [],
            territories: [],
            units: [],
            buyList: boardInfo.buyList,
            conflicts: boardInfo.conflicts
        };
        // Info about the game that will remain constant
        this.info = {
            players: boardInfo.players,
            connections: [],
            unitCatalogue: boardInfo.unitCatalogue,
            imageMap: {} // Map of unitType->imageSource
        };
        this.map = new svgMap.Map(this.boardData, bindTo);
        this.map.on("click:territory", function (territory) {
            if (that.currentPhase && that.currentPhase.onTerritorySelect) {
                that.currentPhase.onTerritorySelect(territory);
            }
        });
        this.isPlayerTurn = false;
        this.currentCountry = null;
        this.currentPhase = null;
        this.phaseName = "";
        this.mapImage = new Image();
        this.parse(boardInfo);
        this.map.drawMap();
        return this;
    };
    _.extend(Game.prototype, backbone.Events); // mixin the events module

    Game.prototype.parse = function(boardInfo) {
        var that = this;
        // lists of game objects whose properties will change as the game progresses
        this.boardData = {
            countries: [],
            territories: [],
            units: [],
            buyList: [],
            conflicts: boardInfo.conflicts
        };
        this.buyList(boardInfo.buyList); // set the buy list
        // Info about the game that will remain constant
        this.info = {
            players: boardInfo.players,
            connections: [],
            unitCatalogue: boardInfo.unitCatalogue,
            imageMap: {} // Map of unitType->imageSource
        };

        this.isPlayerTurn = boardInfo.isPlayerTurn;
        this.wrapsHorizontally = boardInfo.wrapsHorizontally;

        Object.keys(boardInfo.unitCatalogue).forEach(function(unitType) {
            that.info.imageMap[unitType] = _helpers.getImageSource(unitType);
        });

        this.boardData.countries = boardInfo.countries.map(function(countryInfo) {
            return new _c.Country(countryInfo.name, countryInfo.displayName, countryInfo.team, countryInfo.ipc)
        });

        console.table(this.boardData.countries);
        boardInfo.territoryInfo.forEach(function(tInfo) {
            var country = that.getCountry(boardInfo.territoryOwners[tInfo.name]);
            that.boardData.territories.push(new _c.Territory(tInfo, country))
        });

        boardInfo.units.forEach(function(unit){
            that.createUnit(unit.id, unit.type, unit.country, unit.territory, unit.originalTerritory)
        });

        this.currentCountry = that.getCountry(boardInfo.currentCountry);
        this.phaseName = boardInfo.currentPhase;
        if (this.isCurrentPlayersTurn()) {
            this.currentPhase = phaseHelper.createPhase(boardInfo.currentPhase);
        } else {
            this.currentPhase = phaseHelper.createPhase("ObservePhase");
        }
        _helpers.phaseName(this.phaseName);

        _helpers.countryName(this.currentCountry.displayName);
        this.initConnections(boardInfo);
        this.map.update(this.boardData);
        this.trigger("change");
    };

    Game.prototype.fetch = function () {
        var that = this;
        _router.fetchBoard(this.id).done(function(info) {
            that.parse(info);
        });
    };

    Game.prototype.isCurrentPlayersTurn = function () {
        return this.isPlayerTurn;
    };

    Game.prototype.updateConflicts = function () {
        var that = this;
        _router.getConflicts(this.id).done(function(conflicts) {
            that.boardData.conflicts = conflicts;
            that.trigger("change");
        })
    };

    Game.prototype.initConnections = function(connectionJson) {
        var that = this;
        connectionJson.connections.map(function(c) {
            var first = null,
                second = null;
            that.boardData.territories.forEach(function(t) {
                if (t.name == c[0]){
                    first = t;
                } else if (t.name == c[1]) {
                    second = t;
                }
            });
            first.connections.push(second);
            second.connections.push(first);
        });

    };

    Game.prototype.setImage = function(srcImagePath, onLoadFunction) {
        this.mapImage = this.mapImage || new Image();
        this.mapImage.src = srcImagePath;
        this.mapImage.onload = onLoadFunction;
    };

    Game.prototype.currentPhaseName = function() {
        return this.phaseName;
    };

    Game.prototype.buyList = function(buyList) {
        if (buyList) {
            _.some(buyList, function verify(boughtUnitInfo) {
                if (!boughtUnitInfo.unitType) {
                    throw Error("Bought unit is not an object containing unitType", boughtUnitInfo)
                }
            });
            this.boardData.buyList = buyList;
        } else {
            return this.boardData.buyList;
        }
        this.trigger("change:buyList change");
    };

    Game.prototype.unitInfo = function(unitType) {
        return this.info.unitCatalogue[unitType];
    };

    Game.prototype.createUnit = function(unitId, unitType, country, territory, originalTerritory) {
        // If territory is a string, not a Territory object, assume we were passed the name of the territory
        if (typeof territory === "string") {
            territory = this.getTerritory(territory)
        }
        if (typeof originalTerritory === "string") {
            originalTerritory = this.getTerritory(originalTerritory);
        }
        if (typeof country === "string") {
            country = this.getCountry(country); // assume we were passed the country's name
        }
        var newUnit = new _c.Unit(unitId, unitType, this.unitInfo(unitType), country, territory, originalTerritory);
        this.addUnit(newUnit);
    };

    Game.prototype.addUnit = function(unit) {
        this.boardData.units.push(unit);
    };

    Game.prototype.getMapWidth = function() {
        if (this.wrapsHorizontally) {
            return this.mapImage.width/2;
        } else {
            return this.mapImage.width
        }
    };

    Game.prototype.getCountry = function(name) {
        var countries = this.boardData.countries;
        for (var i=0; i < countries.length; i++) {
            if (countries[i].name === name) {
                return countries[i];
            }
        }
    };

    Game.prototype.getTerritory = function(name) {
        for (var i=0; i < this.boardData.territories.length; i++) {
            if (this.boardData.territories[i].name === name) {
                return this.boardData.territories[i];
            }
        }
    };

    Game.prototype.territoriesForCountry = function(country) {
        return this.boardData.territories.filter(function(t) {
            return t.country == country;
        });
    };

    Game.prototype.unitsForCountry = function(country) {
        return this.boardData.units.filter(function(u) {
            return u.country == country;
        });
    };

    // TODO mirror server logic, using unit.canMove and unit.canMoveThrough
    /**
     * Calculates the distance from one territory to another, for a specific unit
     * @param start Territory
     * @param destination Territory
     * @param unit Unit
     * @returns {number|*}
     */
    Game.prototype.distance = function(start, destination, unit) {
        var frontier = [{
                territory: start,
                distance: 0
            }];
        var checkedNames = {};
        while(frontier.length) {
            // unqueue the first item
            var current = frontier.shift();
            if (current.territory === destination) {
                // Found it!
                return current.distance;
            }
            checkedNames[current.territory.name] = true;
            current.territory.connections.forEach(function(c) {
                if (!(c.name in checkedNames)) {
                    frontier.push({territory: c, distance: current.distance + 1})
                }
            });
        }
        // throw error, path not found?
    };

    /**
     * finds all territories in range of a set of units
     * Very similar to distance method, but slightly optimized
     * @param units Array[Unit]
     * @returns {Array}
     */
    Game.prototype.territoriesInRange = function(units) {
        // MEMO: could refactor logic to hold a list of valid units for each territory. If list is empty, territory is not in range
        var that = this;
        var validNames = {}; // List of names in territory objects for quick look up
        var territoryObjects = []; // List of territory objects. Should be unique.
        units.forEach(function(unit) {
            var frontier = [
                {
                    territory: unit.beginningOfPhaseTerritory,
                    distance: that.distance(unit.beginningOfTurnTerritory, unit.beginningOfPhaseTerritory, unit)
                }];
            var checkedNames = {};
            while(frontier.length) {
                // unqueue the first item
                var current = frontier.shift();
                if (!(current.territory.name in validNames)) {
                    territoryObjects.push(current.territory);
                    validNames[current.territory.name] = true;
                }
                checkedNames[current.territory.name] = true;
                if (current.distance < unit.unitInfo.move) {
                    current.territory.connections.forEach(function(c) {
                        if (!(c.name in checkedNames)) {
                            frontier.push({territory: c, distance: current.distance+1})
                        }
                    })
                }
            }
        });

        return territoryObjects;
    };
    Game.prototype.getConflictByTerritoryName = function(tName) {
        var conflicts = this.boardData.conflicts;
        for (var i = 0; i < conflicts.length; i++) {
            if (conflicts[i].territoryName == tName) {
                return conflicts[i];
            }
        }
        return null;
    };

    Game.prototype.nextPhase = function() {
        var that = this, success = true;
        if (this.currentPhase.endPhase)
            success = this.currentPhase.endPhase();

        if (success && !that.advancingPhase) {
            that.advancingPhase = true;
            _router.nextPhase().done(function(boardData) {
                _helpers.helperText(""); // reset the helper text
                that.parse(JSON.parse(boardData));
            }).always(function() {
                that.advancingPhase = false;
            })
        }
    };

    return {
        Game: Game
    }
});