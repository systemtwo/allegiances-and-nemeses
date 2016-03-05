define(["underscore", "backbone", "svgMap", "components", "helpers", "router", "gameAccessor", "phases/phaseHelper", "dialogs"],
function(_, backbone, svgMap, _c, _helpers, _router, _b, phaseHelper, _dialogs) {
    var Game = function(id, boardInfo, bindTo) {
        var that = this;
        _b.setBoard(this);
        this.id = id;

        this.map = new svgMap.Map({}, bindTo);
        this.map.on("select:territory", function (territory) {
            if (that.currentPhase && that.currentPhase.onTerritorySelect) {
                that.currentPhase.onTerritorySelect(territory);
            }
        });
        this.map.on("click:circle", function (territory, event) {
            _dialogs.showTerritoryUnits(territory, that.map.mapElement[0], event);
        });
        this.map.getCircleContent = function (territory) {
            return territory.units().length;
        };
        this.isPlayerTurn = false;
        this.currentCountry = null;
        this.currentPhase = null;
        this.phaseName = "";
        this.parse(boardInfo);
        this.map.drawMap();
        this.on("change", function () {
            that.map.drawMap();
        });
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
            unitCatalogue: boardInfo.unitCatalogue
        };

        this.isPlayerTurn = boardInfo.isPlayerTurn;
        this.wrapsHorizontally = boardInfo.wrapsHorizontally;
        this.winningTeam = boardInfo.winningTeam;

        this.boardData.countries = boardInfo.countries.map(function(countryInfo) {
            return new _c.Country(countryInfo)
        });

        boardInfo.territoryInfo.forEach(function(tInfo) {
            var ownerInfo = boardInfo.territoryOwners[tInfo.name] || {};
            var country = that.getCountry(ownerInfo.current);
            var previous = !ownerInfo.previous || ownerInfo.previous == ownerInfo.current ? country : that.getCountry(ownerInfo.previous);
            that.boardData.territories.push(new _c.Territory(tInfo, country, previous))
        });

        boardInfo.units.forEach(function(unit){
            that.createUnit(unit)
        });

        this.currentCountry = that.getCountry(boardInfo.currentCountry);
        _helpers.countryName(this.currentCountry.displayName);
        this.phaseName = boardInfo.currentPhase;
        if (this.winningTeam) {
            this.currentPhase = phaseHelper.createPhase("Victory")
        } else {
            if (this.isCurrentPlayersTurn()) {
                this.currentPhase = phaseHelper.createPhase(boardInfo.currentPhase);
            } else {
                this.currentPhase = phaseHelper.createPhase("ObservePhase");
            }
            _helpers.phaseName(this.phaseName);
        }

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
        _router.getFields(this.id, ["conflicts", "territoryOwners"]).done(function(response) {
            that.boardData.conflicts = response.conflicts;
            _.each(response.territoryOwners, function (info, territoryName) {
                var territory = that.getTerritory(territoryName);
                if (territory.country.name != info.current) {
                    territory.country = that.getCountry(info.current);
                    territory.previousCountry = that.getCountry(info.previous);
                }
            });
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

    Game.prototype.createUnit = function(unitOptions) {
        // If territory is a string, not a Territory object, assume we were passed the name of the territory
        var countryAndTerritoryInfo = {
            territory: typeof unitOptions.territory === "string" ? this.getTerritory(unitOptions.territory) : unitOptions.territory,
            beginningOfPhaseTerritory: typeof unitOptions.beginningOfPhaseTerritory === "string" ? this.getTerritory(unitOptions.beginningOfPhaseTerritory) : unitOptions.beginningOfPhaseTerritory,
            beginningOfTurnTerritory: typeof unitOptions.beginningOfTurnTerritory === "string" ? this.getTerritory(unitOptions.beginningOfTurnTerritory) : unitOptions.beginningOfTurnTerritory,
            country: typeof unitOptions.country === "string" ? this.getCountry(unitOptions.country) : unitOptions.country
        };
        var newUnit = new _c.Unit(unitOptions.id, unitOptions.type, this.unitInfo(unitOptions.type), countryAndTerritoryInfo);
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

    Game.prototype.getCountries = function () {
        return this.boardData.countries;
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



    Game.prototype.addNeighboursToFrontier = function (frontier, unit, currentItem, checkedNames) {
        var that = this;
        if (unit.canMoveThrough(currentItem.territory)) {
            currentItem.territory.connections.forEach(function(neighbour) {
                // Can't move into enemy territories during non-combat move phase
                var valid = !that.currentPhase.validTerritory || that.currentPhase.validTerritory(neighbour);
                var newDistance = incrementDistance(unit, currentItem.territory, neighbour, currentItem.distance);
                if (valid &&
                    !(neighbour.name in checkedNames) &&
                    that.distanceInRange(unit, newDistance)
                ) {
                    frontier.push({territory: neighbour, distance: newDistance})
                }
            });
        }
    };

    /**
     * Calculates the distance from one territory to another, for a specific unit
     * @param start Territory
     * @param destination Territory
     * @param unit Unit
     * @returns {number} Distance to destination. -1 if not found or out of unit move range
     */
    Game.prototype.calculateDistance = function(start, destination, unit) {
        // MEMO: this function should match Util.py 'distance' method
        var frontier = [{
            territory: start,
            distance: initialDistance(unit)
        }];
        var checkedNames = {};
        while(frontier.length) {
            // unqueue the first item
            var current = frontier.shift();
            if (current.territory === destination) {
                // Found it!
                return current.distance;
            }
            this.addNeighboursToFrontier(frontier, unit, current, checkedNames);
            checkedNames[current.territory.name] = true;
        }
        return -1
    };

    var initialDistance = function (unit) {
        if (unit.isFlying()) {
            return 0;
        } else {
            return {
                land: 0,
                sea: 0
            }
        }
    };
    var incrementDistance = function (unit, origin, desitination, distance) {
        if (unit.isFlying()) {
            return distance + 1;
        } else {
            return {
                // increment land distance if either origin or destination is a land territory
                land: distance.land + (origin.isLand() || desitination.isLand() ? 1 : 0),
                sea: distance.sea + (origin.isSea() || desitination.isSea() ? 1 : 0)
            };
        }
    };
    Game.prototype.distanceInRange = function (unit, distance) {
        if (unit.isFlying()) {
            return distance <= unit.unitInfo.move;
        } else {
            return distance.land <= unit.unitInfo.landMove && distance.sea <= unit.unitInfo.seaMove;
        }
    };
    Game.prototype.combineDistances = function (unit, dA, dB) {
        if (unit.isFlying()) {
            return dA + dB;
        } else {
            return {
                land: dA.land + dB.land,
                sea: dA.sea + dB.sea
            }
        }
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
                    distance: that.calculateDistance(unit.beginningOfTurnTerritory, unit.beginningOfPhaseTerritory, unit)
                }];
            var checkedNames = {};
            while(frontier.length) {
                // unqueue the first item
                var current = frontier.shift();
                if (!(current.territory.name in validNames)) {
                    territoryObjects.push(current.territory);
                    validNames[current.territory.name] = true;
                }
                that.addNeighboursToFrontier(frontier, unit, current, checkedNames);
                checkedNames[current.territory.name] = true;
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