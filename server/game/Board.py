import json
from Country import Country
from Phases import BuyPhase
from Territory import Territory
from Unit import UnitInfo


class Board:
    def __init__(self, units, countries, unitFileName, territoryFileName):
        self.players = []
        self.units = units
        self.countries = countries
        for c in countries:
            c.board = self
        self.currentCountry = Country("Russia")
        self.currentPhase = BuyPhase(self.currentCountry.ipc, self)
        self.attackMoveList = []
        self.buyList = []

        with open(unitFileName) as unitInfo:
            self.unitCatalog = json.load(unitInfo)
        with open(territoryFileName) as territoryInfo:
            self.territoryInfo = json.load(territoryInfo)
        self.territories = []
        for info in self.territoryInfo:
            print(info)
            startingCountry = self.getStartingCountry(info)
            self.territories.append(Territory(info["name"], info["income"], startingCountry))

    def getStartingCountry(self, terInfo):
        for c in self.countries:
            if c.name == terInfo["country"]:
                return c

    def addPlayer(self):
        pass

    def nextTurn(self):
        self.countries = []
        nextIndex = self.countries.index(self.currentCountry) + 1
        if nextIndex > len(self.countries):
            self.currentCountry = self.countries[0]
        else:
            self.currentCountry = self.countries[nextIndex]

    def territoryUnits(self, t):
        unitList = []
        for u in self.units:
            if u.territory == t:
                unitList.append(u)
        return unitList

    def removeUnit(self, u):
        self.units.remove(u)

    def getPath(self, start, goal, unit):
        if start is goal:
            return []
        frontier = [(x, [start]) for x in start.connections]
        checked = []

        while len(frontier) > 0:
            (currentTerritory, path) = frontier.pop()
            if currentTerritory is goal:
                return path

            if canMoveThrough(unit, currentTerritory):
                newPath = path[:]
                newPath.append(currentTerritory)
                for t in currentTerritory.connections:
                    if t not in checked:
                        frontier.append((t, newPath[:]))

            checked.append(currentTerritory)
        return None

    def unitInfo(self, unitType):
        if unitType not in self.unitCatalog:
            return None

        unit_dict = self.unitCatalog[unitType]
        return UnitInfo(unit_dict)


def canMoveThrough(unit, territory):
    unitType = unit.type
    if allied(territory.country, unit.country):
        return True

    if isFlying(unitType):
        return True

    if unitType == "sub":
        # can move if no destroyers present
        if territory.containsUnitType("destroyer") == 0:
            return True

    if unitType == "tank":
        if len(territory.units()):
            return True

    return False


def isFlying(unitType):
    if unitType == "fighter" or unitType == "bomber":
        return True


def allied(a, b):
    return a.team == b.team