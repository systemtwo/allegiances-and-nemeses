class Conflict(object):
    # awesome if we could figure out another way for pycharm to pick up these enums
    inProgress = "inProgress"
    attackerWin = "attackerWin"
    defenderWin = "defenderWin"
    draw = "draw"

    def __init__(self, territory, initialAttackers, initialDefenders):
        """
        :param territory: Territory
        """
        self.territory = territory

        if territory.isLand():
            self.defendingCountry = territory.country
        else:
            # if it's a sea territory, there MUST be at least one defender
            self.defendingCountry = initialDefenders[0].country

        self.attackers = [u for u in initialAttackers if not self.isNonCombatant(u) and not self.isNeutral(u)]
        self.defenders = [u for u in initialDefenders if not self.isNonCombatant(u) and not self.isNeutral(u)]
        self.nonCombatants = {
            'attackers': [u for u in initialAttackers if self.isNonCombatant(u)],
            'defenders': [u for u in initialDefenders if self.isNonCombatant(u)],
            'neutral': [u for u in initialAttackers+initialDefenders if self.isNeutral(u)]
        }
        self.reports = []
        self.outcome = Conflict.inProgress

    def isStalemate(self):
        combatSum = 0
        for u in self.attackers:
            combatSum += u.unitInfo.attack
        for u in self.defenders:
            combatSum += u.unitInfo.defence

        return combatSum == 0

    def isNonCombatant(self, unit):
        return ((self.territory.isLand() and unit.isSea()) or
                (self.territory.isSea() and unit.isLand()))

    def isNeutral(self, unit):
        return unit.type == "factory"

    def toDict(self):
        return {
            "territoryName": self.territory.name,
            "attackers": [u.toDict() for u in self.attackers],
            "defenders": [u.toDict() for u in self.defenders],
            "reports": [r.toDict() for r in self.reports],
            "outcome": self.outcome
        }