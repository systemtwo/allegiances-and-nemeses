from . import UniqueId
import uuid
from GameBoard import Util


class Unit:
    def __init__(self, unitInfo, country, territory, overrideId=None):
        """
        Creates a single unit
        :param unitInfo: UnitInfo
        :param country: Country
        :param territory: Territory
        :param overrideId: String Use the given id instead of generating a new id
        """
        assert hasattr(territory, "name")
        assert hasattr(country, "name")
        self.type = unitInfo.unitType
        self.unitInfo = unitInfo
        self.movedToTerritory = territory  # the territory the unit has been moved to. Only relevant on client side.
        self.territory = territory
        self.originalTerritory = territory
        self.country = country
        if overrideId:
            self.id = overrideId
        else:
            self.id = UniqueId.getUniqueId()

    def reset(self):
        self.originalTerritory = self.territory
        self.movedToTerritory = self.territory

    def isFlying(self):
        return self.unitInfo.terrainType == "air"

    def isLand(self):
        return self.unitInfo.terrainType == "land"

    def isSea(self):
        return self.unitInfo.terrainType == "sea"

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

def fromDict(unitDef, allUnitInfo, countries, territories):
    unit = Unit(
        allUnitInfo[unitDef["type"]],
        Util.getByName(countries, unitDef["country"]),
        Util.getByName(territories, unitDef["beginningOfPhaseTerritory"]),
        uuid.UUID(unitDef["id"]))
    unit.originalTerritory = Util.getByName(territories, unitDef["beginningOfTurnTerritory"])
    return unit

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
        self.terrainType = dictionary["terrainType"]

        if self.terrainType == "air":
            self.movement = dictionary["move"]
        else:
            self.seaMove = dictionary["seaMove"]
            self.landMove = dictionary["landMove"]

        self.attack = dictionary["attack"]
        self.defence = dictionary["defence"]

        self._dictionary = dictionary  # store for exporting

        if "description" in dictionary:
            self.description = dictionary["description"]

    def toDict(self):
        return self._dictionary

    def __getitem__(self, item):
        return getattr(self, item)