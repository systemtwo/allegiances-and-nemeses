define(["gameAccessor", "helpers", "dialogs", "router", "components"], function(_b, _helpers, _dialogs, _router, _c) {

    // Resolve all attacks made during the movement phase
    function ResolvePhase() {
        _helpers.phaseName("Resolve Conflicts");
        this.updateConflicts();
        _helpers.helperText("Fight for control of territories");
        return this;
    }

    ResolvePhase.prototype.updateConflicts = function () {
        var that = this;
        _router.updateConflicts(_b.getBoard().id).done(function () {
            _dialogs.showConflictList();
            if (!that.hasUnresolvedConflicts()) {
                _helpers.helperText("All conflicts are resolved. End the turn");
            }
        });
    };

    ResolvePhase.prototype.hasUnresolvedConflicts = function () {
        var conflicts = _b.getBoard().boardData.conflicts;
        return _.some(conflicts, function isUnresolved(conflict) {
            return conflict.outcome === _c.conflictOutcomes.IN_PROGRESS;
        });
    };

    ResolvePhase.prototype.retreat = function () {
        // Notify the server about retreat. Only send request, then update game state from response.
    };

    ResolvePhase.prototype.battle = function () {
        // send battle request to server
        // Get result
        // Update conflict with matching territory
    };

    ResolvePhase.prototype.autoResolve = function (tName) {
        var that = this;
        _router.autoResolve(tName).done(function () {
            that.updateConflicts();
        })
    };

    ResolvePhase.prototype.autoResolveAll = function () {
        var that = this;
        _router.autoResolveAll().done(function onAutoResolveSuccess() {
            that.updateConflicts();
        });
    };

    ResolvePhase.prototype.endPhase = function () {
        if (!this.hasUnresolvedConflicts() || confirm("Automatically resolve remaining conflicts?")) {
            _dialogs.closeConflicts();
            return true;
        } else {
            return false;
        }
    };
    return ResolvePhase;
});