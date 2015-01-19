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
    Board.prototype.addUnit = function(unitId, unitType, country, territory, originalTerritory) {
        var i = 0;
        if (typeof territory === "string") {
            territory = this.territoryByName(territory)
        }
        if (typeof originalTerritory === "string") {
            originalTerritory = this.territoryByName(originalTerritory);
        }
        if (typeof country === "string") {
            for (i=0; i < this.countries.length; i++) {
                if (this.countries[i].name === country) {
                    country = this.countries[i];
                    break;
                }
            }
        }
        var newUnit = new _c.Unit(unitId, unitType, country, territory, originalTerritory);
        this.units.push(newUnit);
    };

    Board.prototype.getUnits = function(ids) {
        var idSet = {};
        ids.forEach(function(id){
            idSet[id] = true;
        });
        var units = [];
        this.units.forEach(function(u) {
            if (u.id in idSet) {
                units.push(u);
            }
        });
        if (units.length != ids.length) {
            throw new Error("Could not get all units for given ids", ids)
        }
        return units;
    };
    Board.prototype.territoryByName = function(name) {
        for (var i=0; i< this.territories.length; i++) {
            if (this.territories[i].name === name) {
                return this.territories[i];
            }
        }
    };

    return {
        Board: Board
    }
});