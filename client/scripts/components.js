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

    var Territory = function(name, income, country, x, y, width, height) {
        this.name = name;
        this.income = income;
        this.country = country;
        this.previousOwner = country;
        this.connections = [];
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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


    /**
     * Not currently in use - only for IDE to detect properties
     * @constructor
     */
    var Conflict = function() {
        this.outcomes = {
            DEFENDER: "defenderWin",
            ATTACKER: "attackerWin",
            IN_PROGRESS: "inProgress"
        };
        this.attackers = [];
        this.defenders = [];
        this.reports = [];
        this.outcome = this.outcomes.IN_PROGRESS;
        this.territoryName = null;
    };

    var Country = function(name, team, ipc) {
        this.name = name;
        this.ipc = ipc;
        this.team = team;
        return this;
    };

    return {
        Country: Country,
        Conflict: Conflict,
        Territory: Territory,
        Unit: Unit
    }
});