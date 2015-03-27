define(["gameAccessor", "helpers", "dialogs", "router"], function(_b, _helpers, _dialogs, _router) {

    // Resolve all attacks made during the movement phase
    function ResolvePhase() {
        _helpers.phaseName("Resolve Conflicts");
        this.updateConflicts();
        return this;
    }

    ResolvePhase.prototype.updateConflicts = function () {
        _router.updateConflicts(_b.getBoard().id).done(function () {
            _dialogs.showConflictList();
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
        _dialogs.closeConflicts();
        return true;
    };
    return ResolvePhase;
});