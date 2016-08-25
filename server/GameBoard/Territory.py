class BaseTerritory:
    def __init__(self, name, displayName, territoryType, displayInfo):
        self.name = name
        self.displayName = displayName
        self.connections = []
        self.displayInfo = displayInfo
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
            "displayName": self.displayName,
            "displayInfo": self.displayInfo,
            "type": self.type,
            "connections": [t.name for t in self.connections]
        }

    def reset(self):
        pass


class LandTerritory(BaseTerritory):
    def __init__(self, name, displayName, income, country, displayInfo):
        BaseTerritory.__init__(self, name, displayName, "land", displayInfo)
        self.income = income
        self.country = country
        self.previousCountry = country

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
    def __init__(self, name, displayName, displayInfo):
        BaseTerritory.__init__(self, name, displayName, "sea", displayInfo)

    def isSea(self):
        return True
