define(["gameAccessor", "helpers", "render", "dialogs", "views/moveUnit/moveUnit"],
function(_b, _helpers, _render, _dialogs, MoveUnitView) {
    var notEnoughMovesReason = "Not enough move points";
    var alreadyAttackedReason = "Already used to attack";

    var movementMixin = {
        initialize: function () {
            _helpers.phaseName(this.phaseName());
            this.states = {
                START: "selectMoveStart",
                DEST: "selectMoveDest",
                SELECT_UNITS: "selectUnits"
            };
            this.setSelectableOriginTerritories();
            this.state = this.states.START;
            this.origin = null;
        },

        /**
         * should return true if a unit is allowed to move at all. False if it cannot move during the current phase.
         * @param unit
         * @returns {boolean}
         */
        movableUnit: function(unit) {
            return unit.unitInfo.move > 0 &&
                _b.getBoard().currentCountry == unit.country;
        },

        /**
         * Territories that have movable units are made clickable
         */
        setSelectableOriginTerritories: function () {
            var board = _b.getBoard();
            _render.setTerritoriesWithUnitsSelectable(board.unitsForCountry(board.currentCountry).filter(this.movableUnit));
        },

        setSelectableDestinationTerritories: function (originTerritory) {
            var controlledUnits = originTerritory.unitsForCountry(_b.getBoard().currentCountry).filter(this.movableUnit);
            // Make selectable any territory that a unit currently in the clicked territory can move to
            _render.setSelectableTerritories(_b.getBoard().territoriesInRange(controlledUnits, _b.getBoard().currentCountry));
        },

        onTerritorySelect: function (territory) {
            if (this.state == this.states.START) {
                this.state = this.states.DEST;
                this.origin = territory;
                this.setSelectableDestinationTerritories(territory);
                _render.showArrowFrom(territory);

            } else if (this.state == this.states.DEST) {
                this.showUnitSelectionWindow(territory);
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

            var distanceToCurrent = _b.getBoard().distance(unit.beginningOfPhaseTerritory, unit.beginningOfTurnTerritory, unit);
            var distanceToDest = _b.getBoard().distance(unit.beginningOfPhaseTerritory, destination, unit);
            console.log(distanceToCurrent, distanceToDest);
            return distanceToCurrent + distanceToDest <= unit.unitInfo.move;
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
            _render.hideArrow();
        }
    };
    return movementMixin;
});