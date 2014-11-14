import json


class BaseTerritory:
    def __init__(self, name):
        self.name = name
        self.connections = []
        self.board = None
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

    def toJSON(self):
        return json.dumps({
            "name": self.name
        })

    def containsUnitType(self, unitType):
        for u in self.units():
            if u.type is unitType:
                return True

        return False


class LandTerritory(BaseTerritory):
    def __init__(self, name, income, country):
        # insert py2 hate here
        # super().__init__(name)
        self.name = name
        self.connections = []
        self.board = None
        self.income = income
        self.country = country

    def toJSON(self):
        return json.dumps({
            "name": self.name,
            "country": self.country.name,
            "income": self.income
        })

class SeaTerritory(BaseTerritory):
    def hasFactory(self):
        return False