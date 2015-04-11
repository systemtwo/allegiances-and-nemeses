define(["gameAccessor", "helpers", "router"], function(_b, _helpers, _router) {
    function ObservePhase() {
        _helpers.phaseName("");
        _helpers.helperText("Wait for the current player to complete their turn");

        setTimeout(function () {
            _b.getBoard().fetch();
        }, 3000);
        return this;
    }

    return ObservePhase;
});