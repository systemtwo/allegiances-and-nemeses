define(["globals"], function(_g) {
function unitInfo(unitType) {
    return {
        attack: 1,
        defence: 2,
        movement: 2,
        cost: 8
    };
}

function countryTerritories(country) {
    _g.getBoard().territories.filter(function(t) {
        return t.country == country;
    })
}

function territoriesSelectable(territories) {

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

    return territories;
}
return {
    unitInfo: unitInfo,
    countryTerritories: countryTerritories,
    getPath: getPath,
    territoriesInRange: territoriesInRange,
    territoriesSelectable: territoriesSelectable
}

});