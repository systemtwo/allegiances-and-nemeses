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
        board.setSelectableTerritories([]);
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

        var territoryFilter = getTerritoryFilter(boughtUnit);

        var validTerritories = getCandidateTerritories().filter(territoryFilter);

        if (!validTerritories.length) {
            alert("No valid territories, cannot place unit");
            return false;
        }
        this.placing = boughtUnit;
        this.placingMany = false; // exit place many mode
        board.setSelectableTerritories(validTerritories);

        if (isLand(boughtUnit)) {
            if (boughtUnit.unitType == "factory") {
                _helpers.helperText("Place your " + boughtUnit.unitType + " in a territory without a factory.");
            } else {
                _helpers.helperText("Place your " + boughtUnit.unitType + " in a territory with a factory.");
            }
        } else if ((isSea(boughtUnit) && board.unitInfo(boughtUnit.unitType).landMove>0) || isFlying(boughtUnit)) {
            _helpers.helperText("Place your " + boughtUnit.unitType +
                " in a territory with a factory or in a sea zone adjacent to a factory.");
        } else {
            _helpers.helperText("Place your " + boughtUnit.unitType +
                " in a sea zone adjacent to a territory with a factory.");
        }
        return true;
    };
    PlacementPhase.prototype.beginPlacingMany = function() {
        var board = _b.getBoard();
        var ownedTerritories = getCandidateTerritories();
        var filterTerritories = (function () {
            var allFilters = _.unique(board.buyList().map(getTerritoryFilter));
            return function (t) {
                // territory is valid if at least one unit can be placed in in
                return _.some(allFilters, function (filter) {
                    return filter(t);
                })
            }
        })();

        var validTerritories = _.filter(ownedTerritories, filterTerritories);

        board.setSelectableTerritories(validTerritories);
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
        board.setSelectableTerritories([]);
        var unitsToPlace = ko.observableArray(
            board.buyList().filter(function (boughtUnit) {
                return boughtUnit.territory != territory.name;
            }).sort(function (a, b) {
                // sort unplaced units to the front
                // returns -1 if a is undefined and b is defined
                // 0 if both defined/undefined
                // 1 if b is undefined, a is defined
                return +!b.territory - !a.territory;
            })
        );
        var existingUnits = ko.observableArray(territory.units());
        var placedUnits = ko.observableArray(board.buyList().filter(function (boughtUnit) {
            return boughtUnit.territory == territory.name;
        }));
        var territoryName = territory.name;
        var viewModel = {
            originUnits: ko.computed(function () {
                return _.map(unitsToPlace(), function (boughtUnit) {
                    var canMove = getTerritoryFilter(boughtUnit)(territory);


                    var imageTitle = boughtUnit.unitType + " | ";
                    if (boughtUnit.territory) {
                        imageTitle += board.getTerritoryDisplayName(boughtUnit.territory);
                    } else {
                        imageTitle += "Not Placed";
                    }
                    return {
                        canMove: canMove,
                        onClick: function () {
                            if (canMove) {
                                that._placeAndSync(boughtUnit, territoryName);
                                placedUnits.push(boughtUnit);
                                unitsToPlace.remove(boughtUnit);
                            }
                        },
                        imageTitle: imageTitle,
                        imageSource: _helpers.getImageSource(board.unitInfo(boughtUnit.unitType), board.currentCountry)
                    }
                })
            }),
            destinationUnits: ko.computed(function () {
                return _.map(placedUnits(), function (boughtUnit) {
                    return {
                        canMove: true,
                        onClick: function () {
                            that._placeAndSync(boughtUnit, "");
                            placedUnits.remove(boughtUnit);
                            unitsToPlace.unshift(boughtUnit);
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
        board.setSelectableTerritories([]);
        this._placeAndSync(placing, territoryName).done(function() {
            that.setInitialText();
        }).fail(function() {
            placing.territory = previousTerritory;
            alert("Invalid Territory");
        });
    };

    PlacementPhase.prototype._placeAndSync = function (unit, territoryName) {
        var board = _b.getBoard();
        var boughtUnit = _.findWhere(board.buyList(), {id: unit.id});
         // We rely here on the placing object to be a member of the boards buylist
        if (!boughtUnit) {
            throw Error("Trying to place a unit not in the buy list")
        }
        boughtUnit.territory = territoryName;  // mutates the element in the list
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

    function getCandidateTerritories() {
        var board = _b.getBoard();
        return _b.getBoard().boardData.territories.filter(function (t) {
            return t.isSea() || t.country.name == board.currentCountry.name;
        })
    }

    function ownedAllTurn(t) {
        var board = _b.getBoard();
        return t.isLand() && t.previousCountry.name == board.currentCountry.name;
    }

    function filterForFactory(t) {
        return t.isLand() && !t.hasFactory() && ownedAllTurn(t) && t.income > 0;
    }

    function filterForLandUnit(t) {
        var board = _b.getBoard();
        var hasFactory = t.hasFactory();
        var numberPlacedInTerritory = _.filter(board.boardData.buyList, function(unit){
            return unit.territory == t.name;
        }).length;

        var hasProductionCapacity = numberPlacedInTerritory < t.income;
        var canPlaceUnit = hasFactory && hasProductionCapacity;
        return t.isLand() && ownedAllTurn(t) && canPlaceUnit;
    }

    function filterForSeaUnit(t) {
        var hasNeighbouringFactory = function() {
            return _.some(t.connections, function (neighbour) {
                return neighbour.hasFactory() && ownedAllTurn(neighbour);
            });
        };

        return t.isSea() && hasNeighbouringFactory();
    }

    function landOrSea(t) {
        return filterForLandUnit(t) || filterForSeaUnit(t);
    }

    function getTerritoryFilter (boughtUnit) {
        if (isLand(boughtUnit)) {
            if (boughtUnit.unitType == "factory") {
                return filterForFactory;
            } else {
                return filterForLandUnit;
            }
        } else if (isSea(boughtUnit)) {
            var board = _b.getBoard();
            if (board.unitInfo(boughtUnit.unitType).landMove > 0) {
                return landOrSea;
            } else {
                return filterForSeaUnit;
            }
        } else if (isFlying(boughtUnit)) {
            return landOrSea;
        } else {
            throw new Error("unknown unit type: " + boughtUnit.unitType)
        }
    }
    function isTerrainType(unit, terrainType) {
        var board = _b.getBoard();
        return board.unitInfo(unit.unitType).terrainType == terrainType;
    }
    function isFlying(unit) {
        return isTerrainType(unit, "air")
    }
    function isLand(unit) {
        return isTerrainType(unit, "land")
    }
    function isSea(unit) {
        return isTerrainType(unit, "sea")
    }

    return PlacementPhase;
});
