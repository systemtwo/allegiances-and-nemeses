import UniqueId
import Util


class Unit:
    def __init__(self, unitInfo, country, territory):
        """
        Creates a single unit
        :param unitInfo: UnitInfo
        :param country: Country
        :param territory: Territory
        """
        assert hasattr(territory, "name")
        assert hasattr(country, "name")
        self.type = unitInfo.unitType
        self.unitInfo = unitInfo
        self.movedToTerritory = territory  # the territory the unit has been moved to. Only relevant on client side.
        self.territory = territory
        self.originalTerritory = territory
        self.country = country
        self.id = UniqueId.getUniqueId()

    def reset(self):
        self.originalTerritory = self.territory

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
        :param territory: Territory
        :return: Boolean True if unit can move through, False if it cannot
        """

        if self.isFlying():
            return True

        if territory.type == "sea":
            if self.type == "sub":
                # can move if no destroyers present
                if not territory.containsUnitType("destroyer"):
                    return True
            if len(territory.enemyUnits(self.country)) == 0:
                return True

        elif territory.type is "land":
            if Util.allied(territory, self.country):
                return True
            if self.type == "tank":
                if len(territory.units()) == 0:
                    return True  # tanks can blitz through empty territories
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

    def hasMoved(self):
        return self.originalTerritory is not self.territory

    def toDict(self):
        return {
            "id": self.id.hex,
            "type": self.type,
            "territory": self.movedToTerritory.name,  # translate to client terminology
            "beginningOfPhaseTerritory": self.territory.name,
            "beginningOfTurnTerritory": self.originalTerritory.name,
            "country": self.country.name
        }


class BoughtUnit:
    def __init__(self, unitType, territory):
        self.unitType = unitType
        self.territory = territory

    # For our current purposes, bought units have very loose equality checks
    def __eq__(self, other):
        return isinstance(other, BoughtUnit) and other.unitType == self.unitType

    def toDict(self):
        tName = ""
        if self.territory is not None:
            tName = self.territory.name
        return {
            "unitType": self.unitType,
            "territory": tName
        }



class UnitInfo:
    def __init__(self, unitType, dictionary):
        self.unitType = unitType
        self.cost = dictionary["cost"]
        self.movement = dictionary["move"]
        self.attack = dictionary["attack"]
        self.defence = dictionary["defence"]
        self.terrainType = dictionary["terrainType"]

        if "description" in dictionary:
            self.description = dictionary["description"]

    def __getitem__(self, item):
        return getattr(self, item)