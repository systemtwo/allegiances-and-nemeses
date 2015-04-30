define(["gameAccessor", "helpers", "dialogs", "views/moveUnit/moveUnit"],
function(_b, _helpers, _dialogs, MoveUnitView) {
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
             _b.getBoard().map.on("click:territory", function (territory) {
                 that.onTerritorySelect(territory)
             });
            _helpers.helperText(this.strings.selectStart)
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
            board.map.setSelectableTerritories(territories);
            _helpers.helperText(this.strings.selectStart);
        },

        setSelectableDestinationTerritories: function (originTerritory) {
            var board = _b.getBoard();
            var controlledUnits = originTerritory.unitsForCountry(board.currentCountry).filter(this.movableUnit);
            // Make selectable any territory that a unit currently in the clicked territory can move to
            board.map.setSelectableTerritories(board.territoriesInRange(controlledUnits));
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
            //_render.hideArrow();
        }
    };
    return movementMixin;
});