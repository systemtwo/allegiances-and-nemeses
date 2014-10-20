define(["globals", "helpers", "render"], function(_g, _h, _r) {

var BuyPhase = function() {
    _g.buyList = {};
    _r.showRecruitmentWindow(this);
//    _r.showTerritoryList();
    return this;
};

    // Updates the amount of a certain unit to buy
BuyPhase.prototype.buyUnits = function(unitType, amount) {
    var info = _h.unitInfo(unitType);
    _g.buyList[unitType] = {
        unitType: unitType,
        cost: info.cost,
        amount: amount
    };
    // Notify server
};

BuyPhase.prototype.money = function() {
    return Object.keys(_g.buyList).reduce(function(total, key) {
        var data = _g.buyList[key];
        return total + data.cost*data.amount
    }, 0);
};

BuyPhase.prototype.nextPhase = function() {
    _g.currentPhase = new MovementPhase(_g.board);
    return _g.currentPhase
};


// Move units into enemy (or friendly) territories
// User selects start, then selects destination, then selects which units to send
var MovementPhase = function() {
    this.states = {
        START: "selectMoveStart",
        DEST: "selectMoveDest",
        UNIT: "selectUnits"
    };
    _r.selectableTerritories(_h.countryTerritories(_g.currentCountry));
    this.state = this.states.START;
    this.selectedUnits = [];
    this.origin = null;
    this.destination = null;
    return this;
};

MovementPhase.prototype.onTerritorySelect = function(territory) {
    if (this.state == this.states.START) {
        this.state = this.states.DEST;
        this.origin = territory;
        var controlledUnits = territory.countryUnits(_g.currentCountry);
        // Make selectable any territory that a unit currently in the clicked territory can move to
        _r.selectableTerritories(_h.territoriesInRange(controlledUnits, _g.currentCountry));

    } else if (this.state == this.states.DEST) {
        this.destination = territory;
        this.showUnitSelectionWindow();
        this.state = this.states.UNIT;
    }
};

MovementPhase.prototype.showUnitSelectionWindow = function() {
    var that = this;
    var units = this.origin.units();
    var able = [];
    var unable = [];
    // Find the units currently in the origin territory that are ABLE to move to the destination territory
    // This can be improved by combining with the territoriesInRange check computed previously
    units.forEach(function(unit) {
        if (_h.getPath(unit.originalTerritory, that.destination, unit).length < _h.unitInfo(unit).movement) {
            able.push(unit);
        } else {
            unable.push(unit);
        }
    });

    // renderMoveWindow(able, unable);
};

// Move a set of units to the destination territory
MovementPhase.prototype.moveUnits = function(units) {
    var that = this;
    units.forEach(function(u) {
        u.territory = that.destination;
    });
    this.origin = null;
    this.destination = null;
    this.state = this.states.START;
};

// Resolve all attacks made during the movement phase
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
    // Get result
    // Update conflict with matching territory
};

// Another movement phase, with restrictions on movement.
// Anyone who has moved cannot move again, and territories cannot be attacked

var PlacementPhase = function() {
    this.states = {
        SELECT_UNIT: "selectUnit",
        SELECT_TERRITORY: "selectTerritory"
    };
    this.placed = [];

    this.toPlace = _g.buyList.slice(); // copy to work with
    this.state = this.states.SELECT_UNIT;
    showPlacementWindow();
    return this;
};

PlacementPhase.prototype.validUnitType = function(unitType) {
    for(var i=0; i<this.toPlace.length; i++) {
        if (this.toPlace[i] == unitType) {
            return true;
        }
    }
    return false;
};

PlacementPhase.prototype.onUnitSelect = function(unitType) {
    if (!this.validUnitType(unitType)) return false;

    var that = this;
    this.state = this.states.SELECT_TERRITORY;
    // Find all territories with:
    // a) A factory (or if placing a factory, doesn't have a factory)
    // b) Controlled since beginning of turn
    // c) Units placed < income of territory
    // d) Units placed < factory limit [optional, expansion only]
    var validTerritories = _h.countryTerritories(_g.currentCountry).filter(function(t) {
        var hasFactory = t.hasFactory();
        // ugly XOR
        return ((unitType == "factory" && !hasFactory ||
            unitType != "factory" && hasFactory) &&
            (t.previousOwner != _g.currentCountry) &&
            (that.placed.length < t.income))
    });

    _r.selectableTerritories(validTerritories);
    this.placingType = unitType;
};

PlacementPhase.prototype.cancelCurrentPlacement = function() {
    this.placingType = null;
    this.state = this.states.SELECT_UNIT;
    _r.selectableTerritories([]);
};

PlacementPhase.prototype.onTerritorySelect = function(territory) {
    _g.board.addUnit(this.placingType, territory, _g.currentCountry);
    this.placed.push(this.placingType);
    // push to server? or wait for end of phase?
};

return {
    BuyPhase: BuyPhase,
    MovementPhase: MovementPhase,
    ResolvePhase: ResolvePhase,
    PlacementPhase: PlacementPhase
}

});