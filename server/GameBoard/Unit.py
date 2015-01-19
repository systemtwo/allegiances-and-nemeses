import json
import UniqueId
import Util


class Unit:
    def __init__(self, unitInfo, country, territory):
        """
        Creates a single unit
        :param unitInfo: UnitInfo
        :param country:
        :param territory:
        """
        self.type = unitInfo.unitType
        self.unitInfo = unitInfo
        self.territory = territory
        self.previousTerritory = territory
        self.country = country
        self.id = UniqueId.getUniqueId()

    def isFlying(self):
        return self.unitInfo.terrainType == "air"

    def isLand(self):
        return self.unitInfo.terrainType == "land"

    def isSea(self):
        return self.unitInfo.terrainType == "sea"

    # Checks if a unit can move through a territory to another
    def canMoveThrough(self, territory):
        """
        Checks if type of unit can move through a territory
        :param unit: Unit
        :param territory: Territory
        :return: Boolean True if unit can move through, False if it cannot
        """

        if self.isFlying():
            return True

        if territory.type is "sea":
            if self.type == "sub":
                # can move if no destroyers present
                if territory.containsUnitType("destroyer") == 0:
                    return True
            if len(territory.enemyUnits(self.country)) is 0:
                return True

        elif territory.type is "land":
            if Util.allied(territory.country, self.country):
                return True
            if self.type == "tank":
                if len(territory.units()):
                    return True
        return False

    def canMoveInto(self, territory):
        if self.isFlying():
            return True

        if territory.type == "sea":
            if not self.isLand():
                return True
        elif territory.type == "land":
            if not self.isSea():
                return True
        return False

    def toJSON(self):
        return json.dumps({
            "id": self.id.hex,
            "type": self.type,
            "territory": self.territory.name,
            "country": self.country.name
        })


class UnitInfo:
    def __init__(self, unitType, dictionary):
        self.unitType = unitType
        self.cost = dictionary["cost"]
        self.movement = dictionary["move"]
        self.attack = dictionary["attack"]
        self.defense = dictionary["defence"]
        self.terrainType = dictionary["terrainType"]

        if "description" in dictionary:
            self.description = dictionary["description"]