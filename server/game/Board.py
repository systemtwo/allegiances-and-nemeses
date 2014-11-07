import json
from UniqueId import getUniqueId
from Country import Country
from Phases import BuyPhase
from Territory import LandTerritory, SeaTerritory
from Unit import UnitInfo
import Util


class Board:
    def __init__(self, moduleName):
        self.id = getUniqueId()
        self.players = []
        self.units = []
        self.attackMoveList = []
        self.buyList = []
        self.moduleName = moduleName

        # load json from module
        with open(Util.filePath(moduleName, "info.json")) as file:
            self.moduleInfo = json.load(file)

        with open(Util.countryFileName(moduleName)) as countryInfo:
            self.countries = [Country(c["name"], c["team"], self) for c in json.load(countryInfo)]

        with open(Util.unitFileName(moduleName)) as unitInfo:
            self.unitCatalogue = json.load(unitInfo)

        with open(Util.territoryFileName(moduleName)) as territoryInfo:
            self.territoryInfo = json.load(territoryInfo)

        self.territories = []
        for info in self.territoryInfo:
            if info["type"] == "land":
                startingCountry = self.getStartingCountry(info)
                self.territories.append(LandTerritory(info["name"], info["income"], startingCountry))
            elif info["type"] == "sea":
                self.territories.append(SeaTerritory(info["name"]))
            else:
                print("Territory info does not have valid type")
                print(info)

        with open(Util.connectionFileName(moduleName)) as connections:
            self.connections = json.load(connections)
            for c in self.connections:
                first = None
                second = None
                for t in self.territories:
                    if t.name == c[0]:
                        first = t
                    elif t.name == c[1]:
                        second = t
                if first and second:
                    first.connections.append(second)
                    second.connections.append(first)
                else:
                    raise Exception("Could not find territories for connection: " + json.dumps(c))


        # begin
        self.currentCountry = self.countries[0]
        self.currentPhase = BuyPhase(self.currentCountry.ipc, self)

    def getStartingCountry(self, terInfo):
        if "country" not in terInfo:
            print("No country set for territory\n")
            print(terInfo)
            return
        for c in self.countries:
            if c.name == terInfo["country"]:
                return c

    def addPlayer(self):
        pass

    def toDict(self):
        return {
            "countries": [c.toJSON() for c in self.countries],
            "territoryInfo": self.territoryInfo,  # doesn't have CURRENT territory owners, only initial
            "connections": self.connections,
            "players": self.players,
            "units": [u.toJSON() for u in self.units],

            # Module info
            "unitCatalogue": self.unitCatalogue,
            "wrapsHorizontally": self.moduleInfo["wrapsHorizontally"],
            "imageName": self.moduleInfo["imageName"],
            "moduleName": self.moduleName
        }

    # Proceed to the next country's turn. This is different than advancing a phase (1/6th of a turn)
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

    # Finds a path from the start to the goal, based on the unit's type and country
    def getPath(self, start, goal, unit):
        if start is goal:
            return []
        frontier = [(x, [start]) for x in start.connections]
        checked = []

        while len(frontier) > 0:
            (currentTerritory, path) = frontier.pop(0)
            if currentTerritory is goal:
                return path + [currentTerritory]

            if Util.canMoveThrough(unit, currentTerritory):
                newPath = path[:]
                newPath.append(currentTerritory)
                for t in currentTerritory.connections:
                    if t not in checked:
                        frontier.append((t, newPath[:]))

            checked.append(currentTerritory)
        return None

    def unitInfo(self, unitType):
        if unitType not in self.unitCatalogue:
            return None

        unit_dict = self.unitCatalogue[unitType]
        return UnitInfo(unit_dict)