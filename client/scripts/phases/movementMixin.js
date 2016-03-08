define(["underscore", "gameAccessor", "helpers", "dialogs", "views/moveUnit/moveUnit"],
function(_, _b, _helpers, _dialogs, MoveUnitView) {
    var movementMixin = {
        strings: {
            selectStart: "Select a territory to move from",
            selectDest: "Select a territory to move to",
            moveUnits: "Click units to move them"
        },
        initialize: function () {
            var that = this;
            _helpers.phaseName(this.phaseName());
            this.states = {
                START: "selectMoveStart",
                DEST: "selectMoveDest",
                SELECT_UNITS: "selectUnits"
            };
            this.setSelectableOriginTerritories();
            this.state = this.states.START;
            this.origin = null;
            _helpers.helperText(this.strings.selectStart)
        },

        /**
         * should return true if a unit is allowed to move at all. False if it cannot move during the current phase.
         * @param unit
         * @returns {boolean}
         */
        movableUnit: function(unit) {
            var belongsToCurrentCountry = _b.getBoard().currentCountry == unit.country;

            if (unit.isFlying()) {
                return unit.unitInfo.move > 0 && belongsToCurrentCountry;
            } else {
                return unit.unitInfo.landMove + unit.unitInfo.seaMove > 0 && belongsToCurrentCountry;
            }
        },

        /**
         * Territories that have movable units are made clickable
         */
        setSelectableOriginTerritories: function () {
            var board = _b.getBoard();
            var units = board.unitsForCountry(board.currentCountry).filter(this.movableUnit);
            //unique list of all the territories the current country has units in
            var territories = [];
            var territoryNames = {};
            units.forEach(function(u) {
                if (!(u.territory.name in territoryNames)) {
                    territoryNames[u.territory.name] = true;
                    territories.push(u.territory)
                }
            });
            board.setSelectableTerritories(territories);
            _helpers.helperText(this.strings.selectStart);
        },

        setSelectableDestinationTerritories: function (originTerritory) {
            var board = _b.getBoard();
            var controlledUnits = originTerritory.unitsForCountry(board.currentCountry).filter(this.movableUnit);
            // Make selectable any territory that a unit currently in the clicked territory can move to
            var territoriesInRange = board.territoriesInRange(controlledUnits);
            board.setSelectableTerritories(_.filter(territoriesInRange, function (t) { return t != originTerritory }));
            _helpers.helperText(this.strings.selectDest);
        },

        onTerritorySelect: function (territory) {
            if (this.state == this.states.START) {
                this.state = this.states.DEST;
                this.origin = territory;
                this.setSelectableDestinationTerritories(territory);
                //_b.getBoard().map.showArrowFrom(territory);

            } else if (this.state == this.states.DEST) {
                this.showUnitSelectionWindow(territory);
                _helpers.helperText(this.strings.moveUnits);
                this.state = this.states.SELECT_UNITS;
            } else if (this.state == this.states.SELECT_UNITS) {
                // clicked a new territory anyway instead of selecting units
                // Treat as a cancel and reselect destination
                if (this.origin) {
                    // Open a new window
                    this.showUnitSelectionWindow(territory);
                }
            }
        },

        canMove: function(unit, destination) {
            if (!this.movableUnit(unit))
                return false;

            var board = _b.getBoard();

            var distanceToCurrent = board.calculateDistance(unit.beginningOfPhaseTerritory, unit.beginningOfTurnTerritory, unit);
            var distanceToDest = board.calculateDistance(unit.beginningOfPhaseTerritory, destination, unit);
            return distanceToDest != -1 && board.distanceInRange(unit, board.combineDistances(unit, distanceToCurrent, distanceToDest));
        },

        showUnitSelectionWindow: function (destination) {
            var view = new MoveUnitView(this.origin, destination);
            view.render();
        },

        clickNothing: function() {
            this.reset();
        },

        reset: function () {
            this.origin = null;
            this.state = this.states.START;
            this.setSelectableOriginTerritories();
            //_render.hideArrow();
        }
    };
    return movementMixin;
});