define(["gameAccessor", "helpers", "views/buy/buy"], function(_b, _helpers, BuyView) {
    function BuyPhase() {
        _helpers.phaseName("Purchase Units");
        var buyView = new BuyView();
        buyView.render();
        return this;
    }

    return BuyPhase;
});