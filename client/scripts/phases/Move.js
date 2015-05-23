define(["gameAccessor", "phases/movementMixin", "helpers"],
function(_b, movementMixin, _helpers) {
    // Another movement phase, with restrictions on movement.
    // Anyone who has moved cannot move again (unless it's a plane), and territories cannot be attacked (can only move into friendly territories)
    function MovementPhase() {
        this.initialize();
        _helpers.phaseName("Non-Combat Move");
    }
    $.extend(MovementPhase.prototype, movementMixin);

    MovementPhase.prototype.phaseName = function() {
        return "Noncombat Move";
    };
    MovementPhase.prototype.movableUnit = function(unit) {
        return movementMixin.movableUnit(unit) && (unit.isFlying() || unit.hasNotMoved());
    };
    MovementPhase.prototype.canMove = function (unit, destination) {
        if (!this.validTerritory(destination)) {
            return false; // can't attack this phase
        } else if (unit.isFlying() && !_helpers.allied(unit, destination.previousCountry)) {
            return false; // can't land in a newly captured territory
        } else {
            return movementMixin.canMove.call(this, unit, destination)
        }
    };
    MovementPhase.prototype.validTerritory = function (territory) {
        return _helpers.allied(_b.getBoard().currentCountry, territory);
    };

    return MovementPhase;
});