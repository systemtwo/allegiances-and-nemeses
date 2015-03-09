define(["gameAccessor", "helpers", "render", "dialogs", "router"], function(_b, _helpers, _render, _dialogs, _router) {
    function PlacementPhase() {
        _helpers.phaseName("Place Units");
        this.states = {
            SELECT_UNIT: "selectUnit",
            SELECT_TERRITORY: "selectTerritory"
        };
        this.placed = [];

        // array
        this.toPlace = _b.getBoard().boardData.buyList.slice(); // copy to work with
        this.state = this.states.SELECT_UNIT;
        _dialogs.showPlacementWindow(this.toPlace);
        // Server validation per unit placement? So that others can view in realtime.
        // Or send to server at end of phase
        return this;
    }

    PlacementPhase.prototype.validUnitType = function(unitType) {
        for(var i=0; i<this.toPlace.length; i++) {
            if (this.toPlace[i] == unitType) {
                return true;
            }
        }
        return false;
    };

    // Begin placing unit of unitType
    // returns false on error
    PlacementPhase.prototype.onUnitSelect = function(unitType) {
        // Called by render.js, or other ui related file
        if (!this.validUnitType(unitType)) return false;

        var that = this;
        var board = _b.getBoard();
        this.state = this.states.SELECT_TERRITORY;
        // Find all territories with:
        // a) A factory (or if placing a factory, doesn't have a factory)
        // b) Controlled since beginning of turn
        // c) Units placed < income of territory
        // d) Units placed < factory limit [optional, expansion only, not implemented yet]
        //    The idea is, different sizes of factories with their own placement limits.
        var validTerritories = board.territoriesForCountry(board.currentCountry).filter(function(t) {
            var hasFactory = t.hasFactory();
            return (((unitType == "factory" && !hasFactory) || // factories are one per territory
                (unitType != "factory" && hasFactory)) &&  // otherwise, must place in territories with a factory
                (t.previousOwner == board.currentCountry) &&
                (that.placed.length < t.income))
        });

        if (!validTerritories.length) {
            console.error("No valid territories, cannot place unit");
            return false;
        }
        _render.setSelectableTerritories(validTerritories);
        this.placingType = unitType;
        return true;
    };

    PlacementPhase.prototype.clickNothing = function() {
        this.setStateSelectUnit();
    };

    PlacementPhase.prototype.setStateSelectUnit = function() {
        this.placingType = null;
        this.state = this.states.SELECT_UNIT;
        _render.setSelectableTerritories([]);
        _dialogs.showPlacementWindow(this.toPlace);
    };

    PlacementPhase.prototype.onTerritorySelect = function(territory) {
        var that = this;
        _router.placeUnit(territory.name, this.placingType).done(function() {
            that.placed.push(that.placingType);
            var index = that.toPlace.indexOf(that.placingType);
            if (index > -1) {
                that.toPlace.splice(index, 1);
            }
            that.setStateSelectUnit();
        }).fail(function() {
            alert("Invalid Territory");
        });
    };
    return PlacementPhase;
});