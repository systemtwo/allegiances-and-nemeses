define(["phases/Buy", "phases/Attack", "phases/Resolve", "phases/Move", "phases/Place"],
function(buy, attack, resolve, move, place) {
    var phaseMap = {
        "BuyPhase": buy,
        "AttackPhase": attack,
        "ResolvePhase": resolve,
        "MovementPhase": move,
        "PlacementPhase": place
    };
    return {
        createPhase: function (phaseName) {
            return new phaseMap[phaseName]();
        }
    }
});