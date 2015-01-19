import json


class Country:
    def __init__(self, name, teamName, player, board=None):
        self.name = name
        self.team = teamName
        self.player = player #Not sure if this is a good idea. Maybe move this one level up
        self.board = board
        self.ipc = 0

    def collectIncome(self):
        for t in self.board.territories:
            if hasattr(t, "country") and t.country == self:
                self.ipc += t.income

    def toJSON(self):
        return json.dumps({
            "name": self.name,
            "team": self.team,
            "ipc": self.ipc
        })
