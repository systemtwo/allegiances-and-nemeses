class Country:
    def __init__(self, name, displayName, teamName, player, board=None):
        self.name = name
        self.displayName = displayName
        self.team = teamName
        self.player = player #Not sure if this is a good idea. Maybe move this one level up
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
            "ipc": self.ipc
        }
