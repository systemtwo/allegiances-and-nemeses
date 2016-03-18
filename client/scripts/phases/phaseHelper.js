define(["phases/Buy", "phases/Attack", "phases/Resolve", "phases/Move", "phases/Place", "phases/Observe", "phases/Victory"],
function(buy, attack, resolve, move, place, observe, victory) {
    var phaseMap = {
        "BuyPhase": buy,
        "AttackPhase": attack,
        "ResolvePhase": resolve,
        "MovementPhase": move,
        "PlacementPhase": place,
        "ObservePhase": observe,
        "Victory": victory
    };
    return {
        createPhase: function (phaseName) {
            return new phaseMap[phaseName]();
        }
    }
});