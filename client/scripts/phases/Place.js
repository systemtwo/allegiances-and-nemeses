define(["gameAccessor", "helpers", "render", "dialogs", "router"], function(_b, _helpers, _render, _dialogs, _router) {
    function PlacementPhase() {
        _helpers.phaseName("Place Units");
        _render.setSelectableTerritories([]);
        this.placing = null; // The BoughtUnit being placed
        return this;
    }

    // Begin placing unit of unitType
    // returns false on error
    PlacementPhase.prototype.selectBoughtUnit = function(boughtUnit) {
        var that = this;
        var board = _b.getBoard();
        // Find all territories with:
        // a) A factory (or if placing a factory, doesn't have a factory)
        // b) Controlled since beginning of turn
        // c) Units placed < income of territory
        // d) Units placed < factory limit [optional, expansion only, not implemented yet]
        //    The idea is, different sizes of factories with their own placement limits.
        var validTerritories = board.territoriesForCountry(board.currentCountry).filter(function(t) {
            var hasFactory = t.hasFactory();
            var numberPlacedInTerritory = _.filter(board.boardData.buyList, function(unit){
                return unit.territory == t;
            }).length;
            return (((boughtUnit.unitType == "factory" && !hasFactory) || // factories are one per territory
                (boughtUnit.unitType != "factory" && hasFactory)) &&  // otherwise, must place in territories with a factory
                (t.previousOwner == board.currentCountry) &&
                (numberPlacedInTerritory < t.income))
        });

        if (!validTerritories.length) {
            alert("No valid territories, cannot place unit");
            return false;
        }
        this.placing = boughtUnit;
        _render.setSelectableTerritories(validTerritories);
        return true;
    };

    PlacementPhase.prototype.clickNothing = function() {
        this.placeUnit(""); // cancel the unit placement, and reset it to be not placed
    };

    PlacementPhase.prototype.onTerritorySelect = function(territory) {
        this.placeUnit(territory.name);
    };

    PlacementPhase.prototype.placeUnit = function(territoryName) {
        var that = this,
            previousTerritory = this.placing.territory;
        this.placing.territory = territoryName;
         // We rely here on the placing object to be a member of the boards buylist
        if (!_.contains(_b.getBoard().buyList(), this.placing)) {
            throw Error("Trying to place a unit not in the buy list")
        }

        _router.setBuyList(_b.getBoard().buyList()).done(function() {
            _b.getBoard().trigger("change");
            _render.setSelectableTerritories([]);
        }).fail(function() {
            that.placing.territory = previousTerritory;
            alert("Invalid Territory");
        });
    };

    PlacementPhase.prototype.endPhase = function() {
        if (_.some(_b.getBoard().buyList(), function(bought) {
                return !bought.territory;
            })) {
            return confirm("You have unplaced units. End your turn anyways?")
        } else {
            return true;
        }
    };

    return PlacementPhase;
});