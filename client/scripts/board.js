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
        if (typeof territory === "string") {
            for (var i=0; i < this.territories.length; i++) {
                if (this.territories[i].name === territory) {
                    territory = this.territories[i];
                    break;

                }
            }
        }
        if (typeof country === "string") {
            for (var i=0; i < this.countries.length; i++) {
                if (this.countries[i].name === country) {
                    country = this.countries[i];
                    break;

                }
            }
        }
        var newUnit = new _c.Unit(unitType, country, territory);
        this.units.push(newUnit);
    };

    return {
        Board: Board
    }
});