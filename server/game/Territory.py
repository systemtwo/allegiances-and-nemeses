class Territory:
    def __init__(self, name, income, country):
        self.name = name
        self.income = income
        self.connections = []
        self.country = country
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

    def containsUnitType(self, unitType):
        for u in self.units():
            if u.type is unitType:
                return True

        return False