define(["components"], function(_c) {
    var Board = function(image) {
        this.players = [];
        this.units = [];
        this.territories = [];
        this.countries = [];
        this.mapImage = image;
        return this;
    };

    Board.prototype.addUnit = function(unitType, territory, country) {
        var newUnit = new _c.Unit(unitType, territory, country);
        this.units.push(newUnit);
    };

    return {
        Board: Board
    }
});