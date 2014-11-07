define(["globals"], function(_g) {

    function unitInfo(unitType) {
        return _g.unitCatalogue[unitType];
    }

    function territoryByName(name) {
        var territories = _g.getBoard().territories
        for (var i=0; i< territories.length; i++) {
            if (territories[i].name === name) {
                return territories[i];
            }
        }
    }

    function countryTerritories(country) {
        return _g.getBoard().territories.filter(function(t) {
            return t.country == country;
        });
    }

    function countryUnits(country) {
        return _g.getBoard().units.filter(function(u) {
            return u.country == country;
        });
    }

    function getPath(start, destination, unit) {
        var frontier = [{
                territory: start,
                path: []
            }];
        var checkedNames = {};
        while(frontier.length) {
            // unqueue the first item
            var current = frontier.shift();
            if (current.territory === destination) {
                // Found it!
                return current.path;
            }
            checkedNames[current.territory.name] = true;
            current.territory.connections.forEach(function(c) {
                if (!(c.name in checkedNames)) {
                    frontier.push({territory: c, path: current.path.concat(current.territory)})
                }
            });
        }
        // throw error, path not found?
    }

    // finds all territories in range of a set of units
    function territoriesInRange(units) {
        // TODO - filter similar units
        var validNames = {}; // List of names in territory objects for quick look up
        var territoryObjects = []; // List of territory objects. Should be unique.
        units.forEach(function(unit) {
            var frontier = [
                {
                    territory: unit.beginningOfPhaseTerritory,
                    distance: 0
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
                if (current.distance < unitInfo(unit.unitType).move) {
                    current.territory.connections.forEach(function(c) {
                        if (!(c.name in checkedNames)) {
                            frontier.push({territory: c, distance: current.distance+1})
                        }
                    })
                }
            }
        });

        return territoryObjects;
    }

return {
    unitInfo: unitInfo,
    territoryByName: territoryByName,
    countryTerritories: countryTerritories,
    countryUnits: countryUnits,
    getPath: getPath,
    territoriesInRange: territoriesInRange
}

});