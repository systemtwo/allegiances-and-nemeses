class Country:
    def __init__(self, name):
        self.name = name
        self.ipc = 0
        self.team = "ballers"
        self.board = None

    def collectIncome(self):
        for t in self.board.territories:
            if t.country == self:
                self.ipc += t.income