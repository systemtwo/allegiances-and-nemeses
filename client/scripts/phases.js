define(["globals", "helpers", "render", "router"], function(_g, _h, _r, _router) {

    function BuyPhase() {
        _r.phaseName("Purchase Units");
        _g.buyList = {};
        _r.showRecruitmentWindow(this);
        _h.countryUnits(_g.currentCountry).forEach(function(u) {
            u.beginningOfTurnTerritory = u.territory;
        });
    //    _r.showTerritoryList();
        return this;
    }

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

    BuyPhase.prototype.nextPhase = function(onSuccess) {
        var buyList = Object.keys(_g.buyList).map(function(value) {
           return {
               unitType: _g.buyList[value].unitType,
               amount: _g.buyList[value].amount
            }
        });
        _router.endBuyPhase(buyList, function() {
            onSuccess();
            _g.currentPhase = new AttackPhase();
        });
    };


    // Move units into enemy (or friendly) territories
    // User selects start, then selects destination, then selects which units to send
    function AttackPhase() {
        _r.phaseName("Combat Move");
        this.states = {
            START: "selectMoveStart",
            DEST: "selectMoveDest",
            SELECT_UNITS: "selectUnits"
        };
        _h.countryUnits(_g.currentCountry).forEach(function(u) {
            u.beginningOfPhaseTerritory = u.territory;
        });
        this.setSelectableOriginTerritories();
        this.state = this.states.START;
        this.origin = null;
        this.destination = null;
        return this;
    }

    AttackPhase.prototype.filterMovable = function() {
        return true; // Every unit belonging to a country is movable
    };

    AttackPhase.prototype.setSelectableOriginTerritories = function() {
        _r.setTerritoriesWithUnitsSelectable(_h.countryUnits(_g.currentCountry).filter(this.filterMovable));
    };

    AttackPhase.prototype.setSelectableDestinationTerritories = function(originTerritory) {
            var controlledUnits = originTerritory.countryUnits(_g.currentCountry).filter(this.filterMovable);
            // Make selectable any territory that a unit currently in the clicked territory can move to
            _r.setSelectableTerritories(_h.territoriesInRange(controlledUnits, _g.currentCountry));
    };

    AttackPhase.prototype.onTerritorySelect = function(territory) {
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

    AttackPhase.prototype.showUnitSelectionWindow = function() {
        var that = this;
        var units = this.origin.units().filter(this.filterMovable);
        var able = [];
        var unable = [];
        // Find the units currently in the origin territory that are ABLE to move to the destination territory
        // This can be improved by combining with the territoriesInRange check computed previously
        units.forEach(function(unit) {
            var distanceToCurrent = _h.getPath(unit.beginningOfPhaseTerritory, unit.beginningOfTurnTerritory, unit).length;
            var distanceToDest = _h.getPath(unit.beginningOfPhaseTerritory, that.destination, unit).length;
            console.log(distanceToCurrent, distanceToDest);
            if (distanceToCurrent + distanceToDest <= _h.unitInfo(unit.unitType).move) {
                able.push(unit);
            } else {
                unable.push(unit);
            }
        });

        _r.showMoveWindow(able, unable, this.origin, this.destination);
    };

    // Move a set of units to the destination territory. Triggered by the move window, when it's submitted
    // Given a list of unitType(String), originalTerritory (Territory), currentTerritory (String), and amount (int)
    AttackPhase.prototype.moveUnits = function(moveList) {
        var that = this;
        _router.validateMove(this.origin, this.destination, moveList, function onFail() {
            // revert
            console.warn("Attempted invalid move")
        });
        moveList.forEach(function(info) {
            var amount = info.amount;
            var t = _h.territoryByName(info.originalTerritoryName);
            info.currentTerritory.units().forEach(function(u) {
                if (amount > 0 && u.unitType === info.unitType && u.beginningOfPhaseTerritory === t) {
                    amount -= 1;
                    u.territory = that.destination;
                }
            });
        });
        this.origin = null;
        this.destination = null;
        this.state = this.states.START;
        _r.hideArrow();
        this.setSelectableOriginTerritories();
    };

    AttackPhase.prototype.clickNothing = function() {
        this.state = this.states.START;
        this.setSelectableOriginTerritories();
        _r.hideArrow();
    };

    AttackPhase.prototype.nextPhase = function() {
        _router.nextPhase(function onSuccess(conflicts) {
            if (conflicts.length > 0) {
                _g.currentPhase = new ResolvePhase(conflicts);
            } else {
                _g.currentPhase = new MovementPhase();
            }
        });
    };

    // Resolve all attacks made during the movement phase
    function ResolvePhase(conflicts) {
        _r.phaseName("Resolve Conflicts");
        this.conflicts = conflicts;
        this.showConflicts();
        this.currentConflict = null;
    }

    ResolvePhase.prototype.showConflicts = function() {
        // render a window
    };

    ResolvePhase.prototype.retreat = function() {
        // Notify the server about retreat. Only send request, then update game state from response.
    };

    ResolvePhase.prototype.battle = function() {
        // send battle request to server
        // Get result
        // Update conflict with matching territory
    };

    ResolvePhase.prototype.autoresolve = function(territory) {
        // Battle to the death in a conflict territory
        // send request to server
        // Get result
        // Show summary of all battle reports
    };

    // Another movement phase, with restrictions on movement.
    // Anyone who has moved cannot move again (unless it's a plane), and territories cannot be attacked (can only move into friendly territories)
    function MovementPhase() {
        AttackPhase.call(this);
    }
    MovementPhase.prototype = Object.create(AttackPhase.prototype);
    MovementPhase.prototype.filterMovable = function(unit) {
        return unit.isFlying() || unit.hasNotMoved()
    };
    MovementPhase.prototype.constructor = MovementPhase;

    function PlacementPhase() {
        this.states = {
            SELECT_UNIT: "selectUnit",
            SELECT_TERRITORY: "selectTerritory"
        };
        this.placed = [];

        this.toPlace = _g.buyList.slice(); // copy to work with
        this.state = this.states.SELECT_UNIT;
        _r.showPlacementWindow(); // TODO implement placement window and logic.
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
            return ((unitType == "factory" && !hasFactory ||
                unitType != "factory" && hasFactory) &&
                (t.previousOwner != _g.currentCountry) &&
                (that.placed.length < t.income))
        });

        _r.setSelectableTerritories(validTerritories);
        this.placingType = unitType;
    };

    PlacementPhase.prototype.cancelCurrentPlacement = function() {
        this.placingType = null;
        this.state = this.states.SELECT_UNIT;
        _r.setSelectableTerritories([]);
    };

    PlacementPhase.prototype.onTerritorySelect = function(territory) {
        _g.board.addUnit(this.placingType, territory, _g.currentCountry);
        this.placed.push(this.placingType);
        // push to server? or wait for end of phase?
    };

    return {
        BuyPhase: BuyPhase,
        AttackPhase: AttackPhase,
        ResolvePhase: ResolvePhase,
        MovementPhase: MovementPhase,
        PlacementPhase: PlacementPhase
    }

});