define(["underscore", "backbone", "knockout", "svgMap", "components", "helpers", "router", "gameAccessor", "phases/phaseHelper", "dialogs"],
function(_, backbone, ko, svgMap, _c, _helpers, _router, _b, phaseHelper, _dialogs) {
    var Game = function(id, boardInfo, bindTo) {
        var that = this;
        _b.setBoard(this);
        this.id = id;
        this.inTerritoryInfoMode = ko.observable(false);
        this.selectedTerritory = ko.observable(null);

        this.map = new svgMap.Map({}, bindTo);
        this.map.on("select:territory", function (territory) {
            if (that.inTerritoryInfoMode()) {
                that.selectedTerritory(territory);
            } else {
                if (that.currentPhase && that.currentPhase.onTerritorySelect) {
                    that.currentPhase.onTerritorySelect(territory);
                }
            }
        });
        this.map.on("click:circle", function (territory, event) {
            _dialogs.showTerritoryUnits(territory, that.map.mapElement[0], event);
        });
        this.map.getCircleContent = function (territory) {
            return territory.units().length;
        };
        this.map.isCircleVisible = function (territory) {
            return territory.units().length > 0;
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
            unitCatalogue: boardInfo.unitCatalogue
        };

        if (_.isBoolean(boardInfo.isPlayerTurn)) {
            this.isPlayerTurn = boardInfo.isPlayerTurn;
        }
        this.winningTeam = boardInfo.winningTeam;

        this.boardData.countries = boardInfo.countries.map(function(countryInfo) {
            return new _c.Country(countryInfo)
        });

        boardInfo.territories.forEach(function(territoryInfo) {
            var country = that.getCountry(territoryInfo.country);
            var previous;
            if (!territoryInfo.previousCountry || territoryInfo.previousCountry == territoryInfo.country) {
                previous = country; // no need to look up again
            } else {
                previous = that.getCountry(territoryInfo.previousCountry);
            }
            that.boardData.territories.push(new _c.Territory(territoryInfo, country, previous))
        });

        boardInfo.units.forEach(function(unit){
            that.createUnit(unit)
        });

        this.currentCountry = that.getCountry(boardInfo.currentCountry);
        _helpers.countryName(this.currentCountry.displayName);
        if (this.winningTeam) {
            this.currentPhase = phaseHelper.createPhase("Victory")
        } else {
            var phaseName;
            if (this.isCurrentPlayersTurn()) {
                phaseName = boardInfo.currentPhase;
            } else {
                phaseName = "ObservePhase";
            }
            if (this.currentPhaseName() != phaseName) {
                console.log("Changing Phase");
                this.currentPhase = phaseHelper.createPhase(phaseName);
            }
        }
        this.phaseName = boardInfo.currentPhase;
        _helpers.phaseName(this.phaseName);

        this.initConnections();
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
        _router.getFields(this.id, ["conflicts", "territories"]).done(function(response) {
            that.boardData.conflicts = response.conflicts;
            _.each(response.territories, function (info) {
                var territory = that.getTerritory(info.name);
                territory.update(info);
            });
            that.trigger("change");
        })
    };

    Game.prototype.initConnections = function() {
        var that = this;
        that.boardData.territories.map(function(origin) {
            origin.connections = origin.connections.map(function (neighbourName) {
                var foundTerritory = _.findWhere(that.boardData.territories, {name: neighbourName});
                if (!foundTerritory) {
                    throw new Error("Could not find territory " + neighbourName);
                }
                return foundTerritory;
            });
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

    Game.prototype.getConflict = function (id) {
        return _.findWhere(this.boardData.conflicts, {id: id});
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

    Game.prototype.getTerritoryDisplayName = function(territoryName) {
        var territory = this.getTerritory(territoryName);
        return territory && territory.displayName ? territory.displayName : territoryName;
    };

    Game.prototype.getCountryDisplayName = function(countryName) {
        var country = this.getCountry(countryName);
        return country && country.displayName ? country.displayName : countryName;
    };

    Game.prototype.territoriesForCountry = function(country) {
        return this.boardData.territories.filter(function(t) {
            return t.isLand() && t.country.name == country.name;
        });
    };

    Game.prototype.unitsForCountry = function(country) {
        return this.boardData.units.filter(function(u) {
            return u.country.name == country.name;
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
            if (current.territory.name === destination.name) {
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

    Game.prototype.toggleTerritoryInfoMode = function () {
        if (this.inTerritoryInfoMode()) {
            this.exitTerritoryInfoMode();
        } else {
            this.enterTerritoryInfoMode()
        }
        this.inTerritoryInfoMode(!this.inTerritoryInfoMode());
    };

    Game.prototype.enterTerritoryInfoMode = function () {
        this.backupTerritories = this.map.selectableTerritories;
        this.map.setSelectableTerritories(this.boardData.territories);
    };

    Game.prototype.exitTerritoryInfoMode = function () {
        this.map.setSelectableTerritories(this.backupTerritories);
        this.backupTerritories = [];
    };

    Game.prototype.setSelectableTerritories = function (territories) {
        if (this.inTerritoryInfoMode()) {
            this.backupTerritories = territories;
        } else {
            this.map.setSelectableTerritories(territories);
        }
    };

    Game.prototype.nextPhase = function() {
        var that = this, success = true;
        if (this.currentPhase.endPhase)
            success = this.currentPhase.endPhase();

        if (success && !that.advancingPhase) {
            that.advancingPhase = true;
            _router.nextPhase().always(function() {
                that.advancingPhase = false;
            })
        }
    };

    return {
        Game: Game
    }
});