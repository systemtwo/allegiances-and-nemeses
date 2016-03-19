class Country:
    def __init__(self, name, displayName, teamName, color, selectableColor, playable):
        self.eliminated = False
        self.name = name
        self.displayName = displayName
        self.team = teamName
        self.color = color
        self.selectableColor = selectableColor
        self.playable = playable
        self.money = 0
        self.player = None

    def pay(self, amount):
        if amount > self.money:
            raise Exception("Cannot pay more money ({}) than country has ({})".format(amount, self.money))

        self.money -= amount

    def setPlayer(self, userId):
        self.player = userId

    def toDict(self):
        return {
            "name": self.name,
            "displayName": self.displayName,
            "team": self.team,
            "money": self.money,
            "color": self.color,
            "playable": self.playable,
            "player": self.player,  # optional field
            "selectableColor": self.selectableColor
        }

    def eliminate(self):
        self.eliminated = True
