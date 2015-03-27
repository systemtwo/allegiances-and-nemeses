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

    return MovementPhase;
});