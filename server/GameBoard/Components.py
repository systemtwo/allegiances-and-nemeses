import json


class Conflict(object):
    # awesome if we could figure out another way for pycharm to pick up these enums
    noResolution = "none"
    attackerWin = "attackerWin"
    defenderWin = "defenderWin"

    def __init__(self, territory, initialAttackers):
        """
        :param territory: Territory
        :param initialAttackers: list of [Unit]
        """
        self.territory = territory
        self.attackers = initialAttackers
        self.reports = []
        self.resolution = Conflict.noResolution

    def toJSON(self):
        return json.dumps({
            "territoryName": self.territory.name,
            "attackers": [u.toJSON() for u in self.attackers],
            "reports": [r.toJSON() for r in self.reports],
            "resolution": self.resolution
        })