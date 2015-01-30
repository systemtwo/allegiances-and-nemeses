define(["globals", "helpers", "render", "router"], function(_g, _h, _r, _router) {
    var notEnoughMovesReason = "Not enough move points";
    var alreadyAttackedReason = "Already used to attack";

    function BuyPhase() {
        _r.phaseName("Purchase Units");
        _g.buyList = [];
        _r.showRecruitmentWindow(this);
        _h.countryUnits(_g.currentCountry).forEach(function (u) {
            u.beginningOfTurnTerritory = u.territory;
        });
        //    _r.showTerritoryList();
        return this;
    }

    // Updates the amount of a certain unit to buy
    BuyPhase.prototype.buyUnits = function (unitType, targetAmount) {
        var newArray = [];
        _g.buyList.forEach(function(boughtUnitType) {
            if (boughtUnitType === unitType) {
                if (targetAmount > 0) {
                    targetAmount -= 1;
                    newArray.push(boughtUnitType);
                } else {
                    // don't push, we've met the target
                }
            } else {
                newArray.push(boughtUnitType);
            }
        });
        // push to meet target
        for(var i=0; i<targetAmount; i++) {
            newArray.push(unitType);
        }
        _g.buyList = newArray;
        // Notify server?
    };

    BuyPhase.prototype.money = function () {
        return _g.buyList.reduce(function (total, unitType) {
            var data = _h.unitInfo(unitType);
            return total + data.cost;
        }, 0);
    };

    BuyPhase.prototype.nextPhase = function (onSuccess) {
        // send array of unit types to server
        _router.endBuyPhase(_g.buyList).done(function () {
            onSuccess();
            _g.currentPhase = new AttackPhase();
        });
    };


    // Move units into enemy (or friendly) territories
    // User selects start, then selects destination, then selects which units to send
    function AttackPhase() {
        _r.phaseName(this.phaseName());
        this.states = {
            START: "selectMoveStart",
            DEST: "selectMoveDest",
            SELECT_UNITS: "selectUnits"
        };
        _h.countryUnits(_g.currentCountry).forEach(function (u) {
            u.beginningOfPhaseTerritory = u.territory;
        });
        this.setSelectableOriginTerritories();
        _r.nextPhaseButtonVisible(true);
        this.state = this.states.START;
        this.origin = null;
        this.destination = null;
        return this;
    }

    AttackPhase.prototype.phaseName = function () {
        return "Combat Move";
    };

    AttackPhase.prototype.filterMovable = function () {
        return true; // Every unit belonging to a country is movable
    };

    AttackPhase.prototype.setSelectableOriginTerritories = function () {
        _r.setTerritoriesWithUnitsSelectable(_h.countryUnits(_g.currentCountry).filter(this.filterMovable));
    };

    AttackPhase.prototype.setSelectableDestinationTerritories = function (originTerritory) {
        var controlledUnits = originTerritory.countryUnits(_g.currentCountry).filter(this.filterMovable);
        // Make selectable any territory that a unit currently in the clicked territory can move to
        _r.setSelectableTerritories(_h.territoriesInRange(controlledUnits, _g.currentCountry));
    };

    AttackPhase.prototype.onTerritorySelect = function (territory) {
        if (this.state == this.states.START) {
            this.state = this.states.DEST;
            this.origin = territory;
            this.setSelectableDestinationTerritories(territory);

            _r.showArrowFrom(territory);

        } else if (this.state == this.states.DEST) {
            this.destination = territory;
            this.showUnitSelectionWindow();
            this.state = this.states.SELECT_UNITS;
        } else if (this.state == this.states.SELECT_UNITS) {
            // clicked a new territory anyway instead of selecting units
            // Treat as a cancel and reselect destination
            if (this.origin) {
                this.destination = territory;
                // Open a new window
                this.showUnitSelectionWindow();
            }
        }
    };

    AttackPhase.prototype.showUnitSelectionWindow = function () {
        var that = this;
        var units = this.origin.units().filter(this.filterMovable);
        var able = [];
        var unable = [];
        // Find the units currently in the origin territory that are ABLE to move to the destination territory
        // This can be improved by combining with the territoriesInRange check computed previously
        units.forEach(function (unit) {
            var distanceToCurrent = _h.getPath(unit.beginningOfPhaseTerritory, unit.beginningOfTurnTerritory, unit).length;
            var distanceToDest = _h.getPath(unit.beginningOfPhaseTerritory, that.destination, unit).length;
            console.log(distanceToCurrent, distanceToDest);
            if (distanceToCurrent + distanceToDest <= _h.unitInfo(unit.unitType).move) {
                able.push(unit);
            } else {
                unable.push({
                    unit: unit,
                    reason: notEnoughMovesReason
                });
            }
        });

        _r.showMoveWindow(able, unable, this.origin, this.destination);
    };

    // Move a set of units to the destination territory. Triggered by the move window, when it's submitted
    // Given a list of unitType(String), originalTerritory (Territory), currentTerritory (String), and amount (int)
    AttackPhase.prototype.moveUnits = function (moveList) {
        var that = this;
        // cache the origin
        var origin = this.origin;
        var idList = [];
        moveList.forEach(function (info) {
            var amount = info.amount;
            var t = _g.getBoard().territoryByName(info.originalTerritoryName);
            that.origin.units().forEach(function (u) {
                if (amount > 0 && u.unitType === info.unitType && u.beginningOfPhaseTerritory === t) {
                    amount -= 1;
                    idList.push(u.id);
                    u.territory = that.destination;
                }
            });
            if (amount > 0) {
                console.error("Asked to move " + info.amount + " " + info.unitType + ", only moved " + (info.amount - amount))
            }
        });
        _router.validateMove(origin, this.destination, idList).fail(function onFail() {
            _g.board.getUnits(idList).forEach(function (u) {
                u.territory = origin;
            });
            alert("Invalid move");
            that.setSelectableOriginTerritories();
        });
        this.origin = null;
        this.destination = null;
        this.state = this.states.START;
        _r.hideArrow();
        this.setSelectableOriginTerritories();
    };

    AttackPhase.prototype.clickNothing = function () {
        this.state = this.states.START;
        this.setSelectableOriginTerritories();
        _r.hideArrow();
    };

    AttackPhase.prototype.nextPhase = function () {
        _router.nextPhase().done(function onSuccess() {
            _g.currentPhase = new ResolvePhase();
        });
    };

    // Resolve all attacks made during the movement phase
    function ResolvePhase() {
        _r.phaseName("Resolve Conflicts");
        _r.nextPhaseButtonVisible(false);
        this.conflictWindow = null;
        this.updateConflicts();
        return this;
    }

    ResolvePhase.prototype.updateConflicts = function () {
        _router.updateConflicts(_g.board.id).done(function () {
            var unresolvedConflictExists = false;
            _g.conflicts.forEach(function (c) {
                if (c.outcome == "inProgress") {
                    unresolvedConflictExists = true;
                }
            });
            if (unresolvedConflictExists) {
                _r.nextPhaseButtonVisible(false);
            } else {
                _r.nextPhaseButtonVisible(true);
            }
            _r.showConflictList();
        });
    };

    ResolvePhase.prototype.retreat = function() {
        // Notify the server about retreat. Only send request, then update game state from response.
    };

    ResolvePhase.prototype.battle = function() {
        // send battle request to server
        // Get result
        // Update conflict with matching territory
    };

    ResolvePhase.prototype.autoResolve = function(tName) {
        var that = this;
        _router.autoResolve(tName).done(function(){
            that.updateConflicts();
        })
    };

    ResolvePhase.prototype.autoResolveAll = function() {
        var that = this;
        _router.autoResolveAll().done(function onAutoResolveSuccess() {
            that.updateConflicts();
        });
    };

    ResolvePhase.prototype.nextPhase = function() {
        var that = this;
        _router.nextPhase().done(function onSuccess() {
            _r.closeConflicts();
            _g.currentPhase = new MovementPhase();
        });
    };

    // Another movement phase, with restrictions on movement.
    // Anyone who has moved cannot move again (unless it's a plane), and territories cannot be attacked (can only move into friendly territories)
    function MovementPhase() {
        AttackPhase.call(this);
        _r.phaseName("Non-Combat Move");
    }
    MovementPhase.prototype = Object.create(AttackPhase.prototype);
    MovementPhase.prototype.constructor = MovementPhase;

    MovementPhase.prototype.phaseName = function() {
        return "Noncombat Move";
    };
    MovementPhase.prototype.filterMovable = function(unit) {
        return unit.isFlying() || unit.hasNotMoved()
    };
    MovementPhase.prototype.nextPhase = function(unit) {
        _router.nextPhase().done(function() {
            _r.nextPhaseButtonVisible(false);
            _g.currentPhase = new PlacementPhase();
        });
    };

    function PlacementPhase() {
        _r.phaseName("Place Units");
        _r.nextPhaseButtonVisible(true);
        this.states = {
            SELECT_UNIT: "selectUnit",
            SELECT_TERRITORY: "selectTerritory"
        };
        this.placed = [];

        // array
        this.toPlace = _g.buyList.slice(); // copy to work with
        this.state = this.states.SELECT_UNIT;
        _r.showPlacementWindow(this.toPlace);
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
        this.state = this.states.SELECT_TERRITORY;
        // Find all territories with:
        // a) A factory (or if placing a factory, doesn't have a factory)
        // b) Controlled since beginning of turn
        // c) Units placed < income of territory
        // d) Units placed < factory limit [optional, expansion only]
        var validTerritories = _h.countryTerritories(_g.currentCountry).filter(function(t) {
            var hasFactory = t.hasFactory();
            // ugly XOR
            return (((unitType == "factory" && !hasFactory) ||
                (unitType != "factory" && hasFactory)) &&
                (t.previousOwner == _g.currentCountry) &&
                (that.placed.length < t.income))
        });

        if (!validTerritories.length) {
            return false;
        }
        _r.setSelectableTerritories(validTerritories);
        this.placingType = unitType;
        return true;
    };

    PlacementPhase.prototype.clickNothing = function() {
        this.setStateSelectUnit();
    };

    PlacementPhase.prototype.setStateSelectUnit = function() {
        this.placingType = null;
        this.state = this.states.SELECT_UNIT;
        _r.setSelectableTerritories([]);
        _r.showPlacementWindow(this.toPlace);
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

    PlacementPhase.prototype.nextPhase = function() {
        _router.nextPhase().done(function() {
            console.log("DONE");
            // advance to next country's turn
            // probably have to send a request to server to update again, then cycle back to buy phase
        });
    };

    return {
        BuyPhase: BuyPhase,
        AttackPhase: AttackPhase,
        ResolvePhase: ResolvePhase,
        MovementPhase: MovementPhase,
        PlacementPhase: PlacementPhase
    }

});