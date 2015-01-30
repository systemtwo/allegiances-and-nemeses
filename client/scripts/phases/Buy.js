define(["gameAccessor", "helpers", "dialogs", "router"], function(_b, _helpers, _dialogs, _router) {
    function BuyPhase() {
        _helpers.phaseName("Purchase Units");
        _b.getBoard().clearBuyList();
        _dialogs.showRecruitmentWindow(this);
        return this;
    }

    // Updates the amount of a certain unit to buy
    BuyPhase.prototype.buyUnits = function (unitType, targetAmount) {
        var newArray = [];
        var buyList = _b.getBoard().boardData.buyList;
        buyList.forEach(function(boughtUnitType) {
            if (boughtUnitType === unitType) {
                if (targetAmount > 0) {
                    targetAmount -= 1;
                    newArray.push(boughtUnitType);
                } else {
                    // don't push, we've met the target
                }
            } else {
                newArray.push(boughtUnitType);
            }
        });
        // push to meet target
        for(var i=0; i<targetAmount; i++) {
            newArray.push(unitType);
        }
        // TODO use a setter?
        _b.getBoard().boardData.buyList = newArray;
        // Notify server?
    };

    BuyPhase.prototype.money = function () {
        return _b.getBoard().boardData.buyList.reduce(function (total, unitType) {
            var data = _b.getBoard().unitInfo(unitType);
            return total + data.cost;
        }, 0);
    };

    BuyPhase.prototype.nextPhase = function (onSuccess) {
        // send array of unit types to server
        _router.endBuyPhase().done(function () {
            onSuccess();
            _b.getBoard().currentPhase = require("phases/phaseHelper").createPhase("AttackPhase");
        });
    };
    return BuyPhase;
});