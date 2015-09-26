define([
    "gameAccessor",
    "knockout",
    "underscore",
    "helpers",
    "dialogs",
    "router",
    "text!/static/scripts/views/moveUnit/moveUnit.ko.html"],
function(_b, ko, _, _helpers, _dialogs, _router, moveUnitTemplate) {
    function PlacementPhase() {
        var board = _b.getBoard();
        _helpers.phaseName("Place Units");
        board.map.setSelectableTerritories([]);
        this.placing = null; // The BoughtUnit being placed
        this.placingMany = false; // true about to place multiple units. Changes onTerritorySelect behavior
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
    // TODO more validation - on place, and on the server
    PlacementPhase.prototype.selectBoughtUnit = function(boughtUnit) {
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

            var ownedAllTurn = t.previousCountry == board.currentCountry;
            var canPlaceFactory = boughtUnit.unitType == "factory" && !hasFactory && t.income > 0; // factories are one per territory (with production)
            var isUnit = boughtUnit.unitType != "factory"; // otherwise, must place in territories with a factory
            var hasProductionCapacity = numberPlacedInTerritory < t.income;
            var canPlaceUnit = isUnit && hasFactory && hasProductionCapacity;
            return ownedAllTurn && (canPlaceFactory || canPlaceUnit);
        });

        if (!validTerritories.length) {
            alert("No valid territories, cannot place unit");
            return false;
        }
        this.placing = boughtUnit;
        this.placingMany = false; // exit place many mode
        board.map.setSelectableTerritories(validTerritories);

        if (board.unitInfo(boughtUnit.unitType).terrainType == "land") {
            _helpers.helperText("Place your " + boughtUnit.unitType + " in a territory with a factory.");
        } else {
            _helpers.helperText("Place your " + boughtUnit.unitType + " in a sea zone adjacent to a territory with a factory.");
        }
        return true;
    };
    PlacementPhase.prototype.beginPlacingMany = function() {
        var board = _b.getBoard();
        var validTerritories = board.territoriesForCountry(board.currentCountry);
        var unitsToPlace = board.buyList().filter(function (boughtUnit) {
            return !boughtUnit.territory;
        });
        var placingFactory = _.some(unitsToPlace, function (boughtUnit) {
                return boughtUnit.unitType == "factory";
            });

        if (!placingFactory) {
            validTerritories = validTerritories.filter(function(t) {
                return t.hasFactory() && t.previousCountry == board.currentCountry;
            });
        }

        board.map.setSelectableTerritories(validTerritories);
        this.placingMany = true;
        this.placing = null;
        _helpers.helperText("Select a territory containing a factory");
    };

    PlacementPhase.prototype.clickNothing = function() {
        this.placeUnit(""); // cancel the unit placement, and reset it to be not placed
    };

    PlacementPhase.prototype.onTerritorySelect = function(territory) {
        if (this.placing) {
            this.placeUnit(territory.name);
        } else if (this.placingMany) {
            this.placeMany(territory);
        }
    };

    PlacementPhase.prototype.placeMany = function(territory) {
        // open a dialog for placing units
        // load all the territory units, but disable them from being moved
        // dialog should show territory production capacity

        var that = this;
        var element = $("<div>");
        var board = _b.getBoard();
        board.map.setSelectableTerritories([]);
        var boughtUnits = ko.observableArray(board.buyList().filter(function (boughtUnit) {
            return !boughtUnit.territory; // only unplaced units
        }));
        var existingUnits = ko.observableArray(territory.units());
        var placedUnits = ko.observableArray(board.buyList().filter(function (boughtUnit) {
            return boughtUnit.territory == territory.name;
        }));
        var territoryName = territory.name;
        var viewModel = {
            originUnits: ko.computed(function () {
                return _.map(boughtUnits(), function (boughtUnit) {
                    return {
                        canMove: true,
                        onClick: function () {
                            placedUnits.push(boughtUnit);
                            boughtUnits.remove(boughtUnit);
                            that._placeAndSync(boughtUnit, territoryName);
                        },
                        imageTitle: boughtUnit.unitType,
                        imageSource: _helpers.getImageSource(board.unitInfo(boughtUnit.unitType), board.currentCountry)
                    }
                })
            }),
            destinationUnits: ko.computed(function () {
                return _.map(placedUnits(), function (boughtUnit) {
                    return {
                        canMove: true,
                        onClick: function () {
                            placedUnits.remove(boughtUnit);
                            boughtUnits.push(boughtUnit);
                            that._placeAndSync(boughtUnit, "");
                        },
                        imageTitle: boughtUnit.unitType,
                        imageSource: _helpers.getImageSource(board.unitInfo(boughtUnit.unitType), board.currentCountry)
                    }
                }).concat(_.map(existingUnits(), function (unit) {
                    return {
                        canMove: false,
                        onClick: function () {},
                        imageTitle: unit.unitType,
                        imageSource:  _helpers.getImageSource(unit.unitInfo, unit.country)
                    }
                }));
            })
        };
        element.dialog({
            title: "Place units in " + territory.displayName,
            width: 600,
            buttons: {
                "Done": function () {
                    $(this).dialog("close");
                }
            }
        });
        ko.applyBindings(viewModel, element.append(moveUnitTemplate)[0]);
    };

    PlacementPhase.prototype.placeUnit = function(territoryName) {
        var that = this,
            placing = this.placing,
            previousTerritory = placing.territory;

        this.placing = null;
        var board = _b.getBoard();
        board.map.setSelectableTerritories([]);
        this._placeAndSync(placing, territoryName).done(function() {
            that.setInitialText();
        }).fail(function() {
            placing.territory = previousTerritory;
            alert("Invalid Territory");
        });
    };

    PlacementPhase.prototype._placeAndSync = function (unit, territoryName) {
         // We rely here on the placing object to be a member of the boards buylist
        if (!_.contains(_b.getBoard().buyList(), unit)) {
            throw Error("Trying to place a unit not in the buy list")
        }
        unit.territory = territoryName;
        var board = _b.getBoard();
        board.trigger("change");
        return _router.setBuyList(_b.getBoard().buyList());
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