define(["gameAccessor", "helpers"], function(_b, _h) {

    var Unit = function(id, unitType, unitInfo, countryAndTerritory) {
        this.id = id;
        this.unitType = unitType;
        this.unitInfo = unitInfo;
        this.country = countryAndTerritory.country;
        this.territory = countryAndTerritory.territory;
        this.beginningOfPhaseTerritory = countryAndTerritory.beginningOfPhaseTerritory; // start of phase (1/6th of a turn)
        this.beginningOfTurnTerritory = countryAndTerritory.beginningOfTurnTerritory; // Start of countries turn
    };

    Unit.prototype.isFlying = function() {
        return this.unitInfo.terrainType == "air";
    };

    Unit.prototype.isSea = function() {
        return this.unitInfo.terrainType == "sea";
    };

    Unit.prototype.isLand = function() {
        return this.unitInfo.terrainType == "land";
    };

    Unit.prototype.hasNotMoved = function() {
        return this.beginningOfPhaseTerritory === this.beginningOfTurnTerritory;
    };

    /**
     * Checks if type of unit can move through a territory
     * @param territory {Territory}
     * @returns {boolean}
     */
    Unit.prototype.canMoveThrough = function (territory) {
        if (this.isFlying()) {
            return true;
        }

        if (territory.type == "sea") {
            if (this.unitType == "sub") {
                if (!territory.containsUnitType("destroyer")) {
                    return true;
                }
            }
            if (territory.enemyUnits(this.country).length == 0) {
                return true
            }
        } else if (territory.type == "land") {
            if (_h.allied(territory, this)) {
                return true;
            } else if (this.unitType == "tank") {
                if (territory.units().length == 0) {
                    return true;
                }
            }
        }

        return false;
    };

    var Territory = function(territoryInfo, countryObject, previousCountry) {
        this.name = territoryInfo.name;
        this.displayName = territoryInfo.displayName;
        this.connections = [];
        this.displayInfo = territoryInfo.displayInfo;
        this.type = territoryInfo.type;
        if (this.type === "land") {
            this.income = territoryInfo.income;
            this.country = countryObject;
            this.previousCountry = previousCountry;
        }
    };

    Territory.createNew = function (point) {
        point = point || [0,0];
        return new Territory({
            name: Math.random().toString(36).substring(7),
            displayName: "",
            income: 0,
            country: null,
            type: "land",
            displayInfo: {
                circle: {
                    x: point[0],
                    y: point[1]
                },
                name: {
                    x: point[0],
                    y: point[1]
                },
                path: []
            }
        })
    };

    Territory.prototype.units = function () {
        var that = this;
        var board = _b.getBoard();
        var units = board.boardData.units;
        return units.filter(function(u) {
            return u.territory === that;
        });
    };
    Territory.prototype.enemyUnits = function (country) {
        var that = this;
        return _b.getBoard().boardData.units.filter(function(u) {
            return country.team == u.country.team && u.territory === that;
        })
    };

    Territory.prototype.hasFactory = function() {
        return this.containsUnitType("factory");
    };

    /**
     * Checks if the any of the units in this territory are of a given unitType
     * @param unitType {string}
     * @returns {boolean}
     */
    Territory.prototype.containsUnitType = function(unitType) {
        return !!_.findWhere(this.units(), {unitType: unitType});
    };

    Territory.prototype.unitsForCountry = function(country) {
        var that = this;
        var boardUnits = _b.getBoard().unitsForCountry(country);
        return boardUnits.filter(function(u) {
            return u.territory === that;
        })
    };

    Territory.prototype.isLand = function () {
        return this.type == "land";
    };

    Territory.prototype.isSea = function () {
        return this.type == "sea";
    };

    var conflictOutcomes = {
            DRAW: "draw",
            DEFENDER: "defenderWin",
            ATTACKER: "attackerWin",
            IN_PROGRESS: "inProgress"
        };

    /**
     * Not currently in use - only for IDE to detect properties
     * @constructor
     */
    var Conflict = function() {
        this.attackers = [];
        this.defenders = [];
        this.reports = [];
        this.outcome = "";
        this.attackingCountry = "";
        this.defendingCountry = "";
        this.territoryName = null;
    };

    var Country = function(options) {
        this.name = options.name;
        this.displayName = options.displayName;
        this.money = options.money;
        this.team = options.team;
        this.color = options.color;
        this.selectableColor = options.selectableColor;
        return this;
    };

    return {
        Country: Country,
        Conflict: Conflict,
        Territory: Territory,
        Unit: Unit,
        conflictOutcomes: conflictOutcomes
    }
});