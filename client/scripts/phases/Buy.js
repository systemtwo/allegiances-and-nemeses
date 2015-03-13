define(["gameAccessor", "helpers", "views/buy/buy"], function(_b, _helpers, BuyView) {
    function BuyPhase() {
        _helpers.phaseName("Purchase Units");
        this.buyView = new BuyView();
        this.buyView.render();
        return this;
    }

    BuyPhase.prototype.endPhase = function() {
        this.buyView.remove();
    };

    return BuyPhase;
});