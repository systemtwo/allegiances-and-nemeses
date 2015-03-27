define(["gameAccessor", "phases/movementMixin"],
function(_b, movementMixin) {

    // Move units into enemy (or friendly) territories
    // User selects start, then selects destination, then selects which units to send
    function AttackPhase() {
        this.initialize();
        return this;
    }

    $.extend(AttackPhase.prototype, movementMixin);

    AttackPhase.prototype.phaseName = function () {
        return "Combat Move";
    };

    return AttackPhase;
});