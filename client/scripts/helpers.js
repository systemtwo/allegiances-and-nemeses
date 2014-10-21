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

    }

    // finds all territories in range of a set of units
    function territoriesInRange(units) {
        // TODO - filter similar units
        var territories = {};
        units.forEach(function(unit) {
            var frontier = [unit.originalTerritory];
            var checked = {};
            while(frontier.length) {
                // unqueue the first item
                var current = frontier.shift();
                territories[current.territory] = true;
                checked[current.territory] = true;
                if (current.distance < unitInfo(unit.unitType).movement) {
                    current.territory.connections.forEach(function(c) {
                        if (!(c in checked)) {
                            frontier.push({territory: c, distance: current.distance+1})
                        }
                    })
                }
            }
        });

        return Object.keys(territories);
    }

    function territoryAtPoint(x, y) {
        var singleBoardWidth = _g.board.mapImage.width/2;
        if (x > singleBoardWidth) {
            x = x - singleBoardWidth;
        }

        // Temporarily make up for trimming border
        x = x+20;
        y = y+20;
        var territoryList = _g.getBoard().territories
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