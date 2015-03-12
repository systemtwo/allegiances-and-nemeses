class Conflict(object):
    # awesome if we could figure out another way for pycharm to pick up these enums
    inProgress = "inProgress"
    attackerWin = "attackerWin"
    defenderWin = "defenderWin"
    draw = "draw"

    def __init__(self, territory, initialAttackers):
        """
        :param territory: Territory
        :param initialAttackers: list of [Unit]
        """
        self.territory = territory
        self.attackers = initialAttackers
        self.defenders = territory.units()
        self.reports = []
        self.outcome = Conflict.inProgress

    def toDict(self):
        return {
            "territoryName": self.territory.name,
            "attackers": [u.toDict() for u in self.attackers],
            "defenders": [u.toDict() for u in self.defenders],
            "reports": [r.toDict() for r in self.reports],
            "outcome": self.outcome
        }