import json


class Country:
    def __init__(self, name, teamName, board=None):
        self.name = name
        self.team = teamName
        self.ipc = 0
        self.board = board

    def collectIncome(self):
        for t in self.board.territories:
            if t.country == self:
                self.ipc += t.income

    def toJSON(self):
        return json.dumps({
            "name": self.name,
            "team": self.team,
            "ipc": self.ipc
        })