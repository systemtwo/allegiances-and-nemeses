define(["gameAccessor", "helpers", "views/buy/buy"], function(_b, _helpers, BuyView) {
    function BuyPhase() {
        _helpers.phaseName("Purchase Units");
        this.buyView = new BuyView();
        this.buyView.render();
        _helpers.helperText("Choose units to purchase this turn. They'll be placed at the end of your turn");
        return this;
    }

    BuyPhase.prototype.endPhase = function() {
        this.buyView.remove();
        return true;
    };

    return BuyPhase;
});