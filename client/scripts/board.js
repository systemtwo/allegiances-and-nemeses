define(["components"], function(_c) {
    var Board = function(id) {
        this.id = id;
        this.players = [];
        this.units = [];
        this.territories = [];
        this.countries = [];
        this.mapImage = new Image();
        this.wrapsHorizontally = false;
        return this;
    };

    Board.prototype.setImage = function(srcImagePath, onLoadFunction) {
        this.mapImage = this.mapImage || new Image();
        this.mapImage.src = srcImagePath;
        this.mapImage.onload = onLoadFunction;
    };

    Board.prototype.getMapWidth = function() {
        if (this.wrapsHorizontally) {
            return this.mapImage.width/2;
        } else {
            return this.mapImage.width
        }
    };
    Board.prototype.addUnit = function(unitId, unitType, territory, country) {
        var i = 0;
        if (typeof territory === "string") {
            for (i=0; i < this.territories.length; i++) {
                if (this.territories[i].name === territory) {
                    territory = this.territories[i];
                    break;

                }
            }
        }
        if (typeof country === "string") {
            for (i=0; i < this.countries.length; i++) {
                if (this.countries[i].name === country) {
                    country = this.countries[i];
                    break;
                }
            }
        }
        var newUnit = new _c.Unit(unitId, unitType, country, territory);
        this.units.push(newUnit);
    };

    return {
        Board: Board
    }
});