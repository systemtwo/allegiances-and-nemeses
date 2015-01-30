define(["gameAccessor", "phases/movementMixin", "helpers", "router"],
    function(_b, movementMixin, _helpers, _router) {
    var alreadyAttackedReason = "Already used to attack";

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
    MovementPhase.prototype.filterMovable = function(unit) {
        return unit.isFlying() || unit.hasNotMoved()
    };
    MovementPhase.prototype.nextPhase = function(unit) {
        _router.nextPhase().done(function() {
            _helpers.nextPhaseButtonVisible(false);
            _b.getBoard().currentPhase = require("phases/phaseHelper").createPhase("PlacementPhase");
        });
    };

    return MovementPhase;
});