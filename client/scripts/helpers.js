define(["globals"], function(_g) {

    function unitInfo(unitType) {
        return _g.unitCatalogue[unitType];
    }

    function countryTerritories(country) {
        return _g.getBoard().territories.filter(function(t) {
            return t.country == country;
        });
    }

    window.countryT = countryTerritories;

    var selectableTerritories = [];
    function setSelectableTerritories(territories) {
        selectableTerritories = territories;
    }

    function territoryIsSelectable(t) {
        return selectableTerritories.indexOf(t) !== -1;
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
                return current;
            }
            checkedNames[current.territory.name] = true;
            if (current.path.length < unitInfo(unit.unitType).move) {
                current.territory.connections.forEach(function(c) {
                    if (!(c.name in checkedNames)) {
                        frontier.push({territory: c, path: current.path.concat(current.territory)})
                    }
                })
            }
        }

    }

    // finds all territories in range of a set of units
    function territoriesInRange(units) {
        // TODO - filter similar units
        var validNames = {}; // List of names in territory objects for quick look up
        var territoryObjects = []; // List of territory objects. Should be unique.
        units.forEach(function(unit) {
            var frontier = [
                {
                    territory: unit.originalTerritory,
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

    function territoryAtPoint(x, y) {
        var singleBoardWidth = _g.board.mapImage.width/2;
        if (x > singleBoardWidth) {
            x = x - singleBoardWidth;
        }

        var territoryList = _g.getBoard().territories;
        for (var i=0; i<territoryList.length; i++) {
            var t = territoryList[i];
            if (t.x < x &&
                t.y < y &&
                t.x + t.width > x &&
                t.y + t.height > y) {
                return t;
            }
        }
    }


return {
    unitInfo: unitInfo,
    countryTerritories: countryTerritories,
    getPath: getPath,
    territoriesInRange: territoriesInRange,
    setSelectableTerritories: setSelectableTerritories,
    territoryIsSelectable: territoryIsSelectable,
    territoryAtPoint: territoryAtPoint
}

});