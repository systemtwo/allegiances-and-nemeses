import json


class Unit:
    def __init__(self, unitType, country, territory):
        self.type = unitType
        self.territory = territory
        self.previousTerritory = territory
        self.country = country

    def isFlying(self):
        return self.type == "fighter" or self.type == "bomber"

    def isLand(self):
        return self.type != "fighter" and self.type != "bomber"

    def toJSON(self):
        return json.dumps({
            "type": self.type,
            "territory": self.territory.name,
            "country": self.country.name
        })


class UnitInfo:
    def __init__(self, dictionary):
        self.cost = dictionary["cost"]
        self.movement = dictionary["move"]
        self.attack = dictionary["attack"]
        self.defense = dictionary["defence"]

        if "description" in dictionary:
            self.description = dictionary["description"]