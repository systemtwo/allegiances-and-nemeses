class BaseTerritory:
    def __init__(self, name, displayName, territoryType):
        self.name = name
        self.displayName = displayName
        self.connections = []
        self.type = territoryType
        # id tag

    def isLand(self):
        return False

    def isSea(self):
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
            "name": self.name,
            "type": self.type
        }

    def reset(self):
        pass


class LandTerritory(BaseTerritory):
    def __init__(self, name, displayName, income, country):
        BaseTerritory.__init__(self, name, displayName, "land")
        self.connections = []
        self.income = income
        self.country = country
        self.previousCountry = country
        self.type = "land"

    def reset(self):
        self.previousCountry = self.country

    def isLand(self):
        return True

    def toDict(self):
        fields = BaseTerritory.toDict(self)
        fields.update({
            "country": self.country.name,
            "previousCountry": self.previousCountry.name,
            "income": self.income
        })
        return fields


class SeaTerritory(BaseTerritory):
    def __init__(self, name, displayName):
        BaseTerritory.__init__(self, name, displayName, "sea")

    def isSea(self):
        return True
