define(["globals"], function(_g) {

    var Unit = function(unitType, country, territory) {
        this.unitType = unitType;
        this.country = country;
        this.territory = territory;
        // Territory they started from at the beginning of the turn
        this.originalTerritory = territory;
    };


    var Territory = function(name, income, country) {
        this.name = name;
        this.income = income;
        this.country = country;
        this.previousOwner = country;
        this.connections = [];
    };

    Territory.prototype.units = function () {
        var that = this;
        return _g.board.units.filter(function(u) {
            return u.territory === that
        })
    };

    Territory.prototype.hasFactory = function() {
        for(var i=0; i < _g.board.units.length; i++) {
            if (_g.board.units[i].type == "factory") {
                return true;
            }
        }
        return false;
    };

    Territory.prototype.countryUnits = function(country) {
        var that = this;
        return board.units.filter(function(u) {
            return u.territory === that && u.country === country;
        })
    };



    var Conflict = function(territory) {
        this.outcomes = {
            DEFENDER: "defenderWin",
            ATTACKER: "attackerWin",
            IN_PROGRESS: "inProgress"
        };
        this.attackers = [];
        this.defenders = [];
        this.battleReports = [];
        this.outcome = this.outcomes.IN_PROGRESS;
        this.territory = territory;
    };

    var Country = function(name, team) {
        this.name = name;
        this.ipc = 0;
        this.team = team;
        return this;
    };

    return {
        Country: Country,
        Territory: Territory,
        Unit: Unit
    }
});