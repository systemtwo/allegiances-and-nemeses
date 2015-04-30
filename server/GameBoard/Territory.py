import Util


class BaseTerritory:
    def __init__(self, board, name, displayName):
        self.name = name
        self.displayName = displayName
        self.connections = []
        self.board = board
        # id tag

    def units(self):
        return self.board.territoryUnits(self)

    def hasFactory(self):
        for u in self.units():
            if u.type == "factory":
                return True
        return False

    def __hash__(self):
        return hash(str(self.name))

    def __eq__(self, other):
        return str(self.name) == str(other.name)

    def __str__(self):
        return "Territory<" + self.name + ">"

    def __repr__(self):
        return str(self)

    def toDict(self):
        return {
            "name": self.name
        }

    def containsUnitType(self, unitType):
        for u in self.units():
            if u.type is unitType:
                return True

        return False

    def enemyUnits(self, country):
        return [u for u in self.units() if not Util.allied(u.country, country)]

    def reset(self):
        pass


class LandTerritory(BaseTerritory):
    def __init__(self, board, name, displayName, income, country):
        # insert py2 hate here
        # super().__init__(name)
        self.name = name
        self.displayName = displayName  # useful for debugging, don't use for anything else on the server
        self.connections = []
        self.board = board
        self.income = income
        self.country = country
        self.originalCountry = country
        self.type = "land"

    def reset(self):
        self.originalCountry = self.country

    def toDict(self):
        return {
            "name": self.name,
            "country": self.country.name,
            "income": self.income
        }


class SeaTerritory(BaseTerritory):
    def __init__(self, board, name, displayName):
        BaseTerritory.__init__(self, board, name, displayName)
        self.type = "sea"

    def hasFactory(self):
        return False