define(["phases/Buy", "phases/Attack", "phases/Resolve", "phases/Move", "phases/Place", "phases/Observe"],
function(buy, attack, resolve, move, place, observe) {
    var phaseMap = {
        "BuyPhase": buy,
        "AttackPhase": attack,
        "ResolvePhase": resolve,
        "MovementPhase": move,
        "PlacementPhase": place,
        "ObservePhase": observe
    };
    return {
        createPhase: function (phaseName) {
            return new phaseMap[phaseName]();
        }
    }
});