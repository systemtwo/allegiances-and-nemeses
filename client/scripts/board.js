define(function() {
    var Board = function() {
        this.players = [];
        this.units = [];
        this.countries = [];
        this.currentCountry = null;
        this.currentPhase = null;
        this.attackMoveList = [];
        this.buyList = [];
        return this;
    };
    Board.prototype.territoriesSelectable = function(territories) {

    };

    function countryTerritories() {

    }

    return {
        countryTerritories: countryTerritories,
        Board: Board
    }
});