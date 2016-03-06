class Country:
    def __init__(self, name, displayName, teamName, color, selectableColor, playable, board=None):
        self.eliminated = False
        self.name = name
        self.displayName = displayName
        self.team = teamName
        self.color = color
        self.selectableColor = selectableColor
        self.playable = playable
        self.board = board
        self.money = 0
        self.player = None

    def collectIncome(self):
        for t in self.board.territories:
            if hasattr(t, "country") and t.country == self:
                self.money += t.income

    def pay(self, amount):
        if amount > self.money:
            raise Exception("Cannot pay more money ({}) than country has ({})".format(amount, self.money))

        self.money -= amount

    def toDict(self):
        return {
            "name": self.name,
            "displayName": self.displayName,
            "team": self.team,
            "money": self.money,
            "color": self.color,
            "selectableColor": self.selectableColor
        }

    def eliminate(self):
        self.eliminated = True
