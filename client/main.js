var Board = function() {
    this.players = [];
    this.units = [];
    this.countries = [];
    this.currentCountry = null;
    this.currentPhase = null;
    this.attackMoveList = [];
    this.buyList = [];
    return this;
};
var board = new Board();

Board.prototype.territoriesSelectable = function(territories) {

};

function unitInfo(unitType) {
    return {
        attack: 1,
        defence: 2,
        movement: 2,
        cost: 8
    };
}

var Country = function(team) {
    this.ipc = 0;
    this.team = team;
    return this;
};

// PHASES

var BuyPhase = function() {
    board.buyList = [];
    this.moneyCap = board.currentCountry.ipc;
    showRecruitmentWindow();
    return this;
};

BuyPhase.prototype.buyUnit = function(unitType) {
    var info = unitInfo(unitType);
    if (this.money() + info.cost <= this.moneyCap) {
        board.buyList.push(unitType)
    }
};

BuyPhase.prototype.cancel = function(unitType) {
    var removed = false;
    board.buyList.filter(function(u) {
        if (!removed && u != unitType) {
            removed = true;
            return false;
        } else {
            return true;
        }
    })
};

BuyPhase.prototype.undo = function() {
    board.buyList.pop();
};

BuyPhase.prototype.money = function() {
    board.buyList.reduce(function(total, unitType) {
        return total + unitInfo(unitType).cost
    }, 0);
};

BuyPhase.prototype.availableActions = function() {
    // buy shit
};

BuyPhase.prototype.nextPhase = function() {
    board.currentPhase = new MovementPhase(board);
    return board.currentPhase
};


var MovementPhase = function() {
    selectableTerritories(countryTerritories(board.currentCountry));
    this.state = "selectStart";
    this.selectedUnits = [];
    this.origin = null;
    this.destination = null;
    return this;
};

// helper function
function territoriesInRange(territory, country) {
    var unitList = territory.units().filter(function(u, typeList) {
        // Get units belonging to the given country
        return u.country === country;
    });

    // TODO - filter similar units
    var territories = {};
    unitList.forEach(function(unit) {
        var frontier = [unit.originalTerritory];
        var checked = {};
        while(frontier.length) {
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

MovementPhase.prototype.onTerritorySelect = function(territory) {
    if (this.state == "selectStart") {
        this.state = "selectDestination";
        this.origin = territory;
        selectableTerritories(territoriesInRange(territory, board.currentCountry));

    } else if (this.state == "selectDestination") {
        this.destination = territory;
        this.showUnitSelectionWindow();
        this.state = "selectUnits";
    }
};

MovementPhase.prototype.moveUnits = function(units) {
    var that = this;
    units.forEach(function(u) {
        u.territory = that.destination;
    });
    this.origin = null;
    this.destination = null;
    this.state = "selectStart";
};

MovementPhase.prototype.showUnitSelectionWindow = function() {
    var that = this;
//    var units = this.origin.units();
    var units = [];
    var able = [];
    var unable = [];
    units.forEach(function(unit) {
        if (getPath(unit.originalTerritory, that.destination, unit).length < unitInfo(unit).movement) {
            able.push(unit);
        } else {
            unable.push(unit);
        }
    });

    renderWindow(able, unable);
};


var ResolvePhase = function() {
    this.conflicts = this.getConflicts();
    this.showConflicts();
    this.currentConflict = null;
};

ResolvePhase.prototype.getConflicts = function() {
    // Fetch from server
};

ResolvePhase.prototype.showConflicts = function() {
    // render a window
};

ResolvePhase.prototype.retreat = function() {
    this.currentConflict.attackers.forEach(function(unit) {
        unit.territory = unit.originalTerritory;
    });
    // Notify the server about retreat. Move logic to server.
};

ResolvePhase.prototype.battle = function() {
    // send battle request to server
};

// Another movement phase, with restrictions on movement.
// Anyone who has moved cannot move again, and territories cannot be attacked

var PlacementPhase = function() {
    this.states = {
        SELECT_UNIT: "selectUnit",
        SELECT_TERRITORY: "selectTerritory"
    };
    this.placed = [];
    this.state = this.states.SELECT_UNIT;
    showBoughtWindow();
    return this;
};

PlacementPhase.prototype.onUnitSelect = function(unitType) {
    this.state = this.states.SELECT_TERRITORY;

    // Find all territories with:
    // a) A factory
    // b) Controlled since beginning of turn
    // c) Units placed < income of territory
    // d) Units placed < factory limit [optional, expansion only]
    selectableTerritories();
    this.placingType = unitType;
};

PlacementPhase.prototype.cancelPlace = function() {
    this.placingType = null;
    this.state = this.states.SELECT_UNIT;
    selectableTerritories([]);
};

PlacementPhase.prototype.onTerritorySelect = function(territory) {
    var newUnit = new Unit(this.placingType, territory, board.currentCountry);
    board.units.push(newUnit);
    this.placed.push(newUnit);
};