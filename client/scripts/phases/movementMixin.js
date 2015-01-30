define(["gameAccessor", "helpers", "render", "dialogs", "router"],
function(_b, _helpers, _render, _dialogs, _router) {
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
            _helpers.nextPhaseButtonVisible(true);
            this.state = this.states.START;
            this.origin = null;
            this.destination = null;
        },

        setSelectableOriginTerritories: function () {
            var board = _b.getBoard();
            _render.setTerritoriesWithUnitsSelectable(board.unitsForCountry(board.currentCountry).filter(this.filterMovable));
        },

        setSelectableDestinationTerritories: function (originTerritory) {
            var controlledUnits = originTerritory.unitsForCountry(_b.getBoard().currentCountry).filter(this.filterMovable);
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
        },

        showUnitSelectionWindow: function () {
            var that = this;
            var units = this.origin.units().filter(this.filterMovable);
            var able = [];
            var unable = [];
            // Find the units currently in the origin territory that are ABLE to move to the destination territory
            // This can be improved by combining with the territoriesInRange check computed previously
            units.forEach(function (unit) {
                var distanceToCurrent = _b.getBoard().distance(unit.beginningOfPhaseTerritory, unit.beginningOfTurnTerritory, unit);
                var distanceToDest = _b.getBoard().distance(unit.beginningOfPhaseTerritory, that.destination, unit);
                console.log(distanceToCurrent, distanceToDest);
                if (distanceToCurrent + distanceToDest <= _b.getBoard().unitInfo(unit.unitType).move) {
                    able.push(unit);
                } else {
                    unable.push({
                        unit: unit,
                        reason: notEnoughMovesReason
                    });
                }
            });

            _dialogs.showMoveWindow(able, unable, this.origin, this.destination);
        },

        // Move a set of units to the destination territory. Triggered by the move window, when it's submitted
        // Given a list of unitType(String), originalTerritory (Territory), currentTerritory (String), and amount (int)
        moveUnits: function (moveList) {
            var that = this;
            // cache the origin
            var origin = this.origin;
            var idList = [];
            moveList.forEach(function (info) {
                var amount = info.amount;
                var t = _b.getBoard().getTerritory(info.originalTerritoryName);
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
                _b.getBoard().getUnits(idList).forEach(function (u) {
                    u.territory = origin;
                });
                alert("Invalid move");
                that.setSelectableOriginTerritories();
            });
            this.origin = null;
            this.destination = null;
            this.state = this.states.START;
            _render.hideArrow();
            this.setSelectableOriginTerritories();
        },

        clickNothing: function () {
            this.state = this.states.START;
            this.setSelectableOriginTerritories();
            _render.hideArrow();
        }
    };
    return movementMixin;
});