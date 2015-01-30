define(["gameAccessor", "phases/movementMixin", "helpers", "render", "dialogs", "router"],
function(_b, movementMixin, _helpers, _render, _dialogs, _router) {

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

    AttackPhase.prototype.filterMovable = function () {
        return true; // Every unit belonging to a country is movable
    };

    AttackPhase.prototype.nextPhase = function () {
        _router.nextPhase().done(function onSuccess() {
            _b.getBoard().currentPhase = require("phases/phaseHelper").createPhase("ResolvePhase");
        });
    };
    return AttackPhase;
});