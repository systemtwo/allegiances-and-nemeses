define(["gameAccessor", "helpers", "router", "components", "render"],
    function(_b, _helpers, _router, _c, _render) {

    // Resolve all attacks made during the movement phase
    function ResolvePhase() {
        _helpers.phaseName("Resolve Conflicts");
        _render.setSelectableTerritories([]);
        this.updateConflictText();
        this.onChange = this.updateConflictText.bind(this);
        _b.getBoard().on("change", this.onChange);
        return this;
    }

    ResolvePhase.prototype.updateConflictText = function () {
        var that = this;
        if (!that.hasUnresolvedConflicts()) {
            _helpers.helperText("All conflicts are resolved. End the turn");
        } else {
            _helpers.helperText("Fight for control of territories");
        }
    };

    ResolvePhase.prototype.hasUnresolvedConflicts = function () {
        var conflicts = _b.getBoard().boardData.conflicts;
        return _.some(conflicts, function isUnresolved(conflict) {
            return conflict.outcome === _c.conflictOutcomes.IN_PROGRESS;
        });
    };

    ResolvePhase.prototype.endPhase = function () {
        _b.getBoard().off("change", this.onChange);
        return !this.hasUnresolvedConflicts() || confirm("Automatically resolve remaining conflicts?");
    };
    return ResolvePhase;
});