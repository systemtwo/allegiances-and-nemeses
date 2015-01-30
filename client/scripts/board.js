define(["components", "helpers"], function(_c, _helpers) {
    var Game = function(id, boardInfo) {
        var that = this;
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
        this.currentCountry = null;
        this.currentPhase = null;
        this.mapImage = new Image();
        this.wrapsHorizontally = boardInfo.wrapsHorizontally;

        Object.keys(boardInfo.unitCatalogue).forEach(function(unitType) {
            that.info.imageMap[unitType] = _helpers.getImageSource(unitType);
        });

        this.boardData.countries = boardInfo.countries.map(function(countryInfo) {
            return new _c.Country(countryInfo.name, countryInfo.team, countryInfo.ipc)
        });

        console.table(this.boardData.countries);
        boardInfo.territoryInfo.forEach(function(tInfo) {
            var country = that.getCountry(tInfo.country);
            that.boardData.territories.push(new _c.Territory(tInfo.name, tInfo.income, country, tInfo.x, tInfo.y, tInfo.width, tInfo.height))
        });

        boardInfo.units.forEach(function(unit){
            that.createUnit(unit.id, unit.type, unit.country, unit.territory, unit.originalTerritory)
        });

        this.currentCountry = that.getCountry(boardInfo.currentCountry);

        boardInfo.connections.map(function(c) {
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
        return this;
    };

    Game.prototype.setImage = function(srcImagePath, onLoadFunction) {
        this.mapImage = this.mapImage || new Image();
        this.mapImage.src = srcImagePath;
        this.mapImage.onload = onLoadFunction;
    };

    Game.prototype.currentPhaseName = function() {
        return this.currentPhase.constructor.name;
    };

    Game.prototype.clearBuyList = function() {
        this.boardData.buyList = [];
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
        var newUnit = new _c.Unit(unitId, unitType, country, territory, originalTerritory);
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

    Game.prototype.getUnits = function(ids) {
        var idSet = {};
        ids.forEach(function(id){
            idSet[id] = true;
        });
        var units = [];
        this.boardData.units.forEach(function(u) {
            if (u.id in idSet) {
                units.push(u);
            }
        });
        if (units.length != ids.length) {
            throw new Error("Could not get all units for given ids", ids)
        }
        return units;
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

    // finds all territories in range of a set of units
    // Very similar to distance method, but slightly optimized
    Game.prototype.territoriesInRange = function(units) {
        // TODO - filter similar units - is the time spent filtering worth the time saved on calculating move range?
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
                if (current.distance < that.unitInfo(unit.unitType).move) {
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
    return {
        Game: Game
    }
});