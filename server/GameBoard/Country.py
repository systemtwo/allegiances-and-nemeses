class Country:
    def __init__(self, name, displayName, teamName, color, board=None):
        self.name = name
        self.displayName = displayName
        self.team = teamName
        self.color = color
        self.board = board
        self.ipc = 0

    def collectIncome(self):
        for t in self.board.territories:
            if hasattr(t, "country") and t.country == self:
                self.ipc += t.income

    def toDict(self):
        return {
            "name": self.name,
            "displayName": self.displayName,
            "team": self.team,
            "ipc": self.ipc,
            "color": self.color
        }
