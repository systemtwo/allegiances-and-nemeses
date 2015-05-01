define(["gameAccessor", "helpers", "dialogs", "router"], function(_b, _helpers, _dialogs, _router) {
    function PlacementPhase() {
        var board = _b.getBoard();
        _helpers.phaseName("Place Units");
        board.map.setSelectableTerritories([]);
        this.placing = null; // The BoughtUnit being placed
        this.setInitialText();
        return this;
    }

    PlacementPhase.prototype.setInitialText = function() {
        if (this.hasUnplacedUnits()) {
            _helpers.helperText("Select a purchased unit to place");
        } else {
            _helpers.helperText("All units placed. You can end your turn and collect income");
        }
    };

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
        board.map.setSelectableTerritories(validTerritories);

        if (board.unitInfo(boughtUnit.unitType).terrainType == "land") {
            _helpers.helperText("Place your " + boughtUnit.unitType + " in a territory with a factory.");
        } else {
            _helpers.helperText("Place your " + boughtUnit.unitType + " in a sea zone adjacent to a territory with a factory.");
        }
        return true;
    };

    PlacementPhase.prototype.clickNothing = function() {
        this.placeUnit(""); // cancel the unit placement, and reset it to be not placed
    };

    PlacementPhase.prototype.onTerritorySelect = function(territory) {
        if (this.placing) {
            this.placeUnit(territory.name);
        }
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
            var board = _b.getBoard();
            board.trigger("change");
            that.setInitialText();
            board.map.setSelectableTerritories([]);
        }).fail(function() {
            that.placing.territory = previousTerritory;
            alert("Invalid Territory");
        });
    };

    PlacementPhase.prototype.hasUnplacedUnits = function () {
        return _.some(_b.getBoard().buyList(), function(bought) {
                return !bought.territory;
            })
    };

    PlacementPhase.prototype.endPhase = function() {
        if (this.hasUnplacedUnits()) {
            return confirm("You have unplaced units. End your turn anyways?")
        } else {
            return true;
        }
    };

    return PlacementPhase;
});