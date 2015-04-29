define(["gameAccessor"], function(_b) {

    var Unit = function(id, unitType, unitInfo, country, territory, originalTerritory) {
        this.id = id;
        this.unitType = unitType;
        this.unitInfo = unitInfo;
        this.country = country;
        this.territory = territory;
        this.beginningOfPhaseTerritory = territory; // start of phase (1/6th of a turn)
        this.beginningOfTurnTerritory = originalTerritory || territory; // Start of countries turn
    };

    Unit.prototype.isFlying = function() {
        return this.unitType === "fighter" || this.unitType === "bomber";
    };

    Unit.prototype.hasNotMoved = function() {
        return this.beginningOfPhaseTerritory === this.beginningOfTurnTerritory;
    };

    var Territory = function(territoryInfo, countryObject) {
        this.name = territoryInfo.name;
        this.displayName = territoryInfo.displayName;
        this.connections = [];
        this.displayInfo = territoryInfo.displayInfo;
        this.type = territoryInfo.type;
        if (this.type === "land") {
            this.income = territoryInfo.income;
            this.country = countryObject;
            this.previousOwner = countryObject;
        }
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
        var units = this.units();
        for(var i=0; i < units.length; i++) {
            if (units[i].unitType == "factory") {
                return true;
            }
        }
        return false;
    };

    Territory.prototype.unitsForCountry = function(country) {
        var that = this;
        var boardUnits = _b.getBoard().unitsForCountry(country);
        return boardUnits.filter(function(u) {
            return u.territory === that;
        })
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
        this.territoryName = null;
    };

    var Country = function(name, displayName, team, ipc) {
        this.name = name;
        this.displayName = displayName;
        this.ipc = ipc;
        this.team = team;
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