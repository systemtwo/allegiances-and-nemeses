define(["gameAccessor", "helpers", "router"], function(_b, _helpers, _router) {
    function VictoryPhase() {
        _helpers.countryName("Team " + _b.getBoard().winningTeam + " Wins!");

        _helpers.phaseName(null);
        _helpers.helperText("");
    }

    return VictoryPhase;
});