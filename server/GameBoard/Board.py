import json
from Country import Country
from Phases import BuyPhase
from Territory import LandTerritory, SeaTerritory
from Unit import UnitInfo, Unit
import Util


class Board:
    def __init__(self, boardName, moduleName):
        self.name = boardName
        self.players = []
        self.units = []
        self.attackMoveList = []
        self.buyList = []
        self.moduleName = moduleName

        # load json from module
        with open(Util.filePath(moduleName, "info.json")) as file:
            self.moduleInfo = json.load(file)

        with open(Util.countryFileName(moduleName)) as countryInfo:
            self.countries = [Country(c["name"], c["team"], None, self) for c in json.load(countryInfo)]

        with open(Util.unitFileName(moduleName)) as unitInfo:
            self.unitCatalogue = json.load(unitInfo)
            self.unitInfoDict = {unitType: UnitInfo(unitType, jsonInfo) for unitType, jsonInfo in self.unitCatalogue.iteritems()}

        with open(Util.territoryFileName(moduleName)) as territoryInfo:
            self.territoryInfo = json.load(territoryInfo)

        self.territories = []
        for info in self.territoryInfo:
            if info["type"] == "land":
                startingCountry = self.getStartingCountry(info)
                self.territories.append(LandTerritory(self, info["name"], info["income"], startingCountry))
            elif info["type"] == "sea":
                self.territories.append(SeaTerritory(self, info["name"]))
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

        # add units
        with open(Util.filePath(moduleName, "unitSetup.json")) as unitFile:
            unitSetup = json.load(unitFile)
            for countryName, territoryUnitMap in unitSetup.iteritems():
                country = self.getCountryByName(countryName)
                for tName, unitTypes in territoryUnitMap.iteritems():
                    territory = self.territoryByName(tName)
                    for unitType in unitTypes:
                        self.units.append(Unit(self.unitInfo(unitType), country, territory))

        # begin
        for c in self.countries:
            c.collectIncome()
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

    def toDict(self):
        return {
            "name": self.name,
            "countries": [c.toDict() for c in self.countries],
            "territoryInfo": self.territoryInfo,  # doesn't have CURRENT territory owners, only initial
            "connections": self.connections,
            "players": self.players,
            "units": [u.toDict() for u in self.units],
            "currentPhase": self.currentPhase.name,

            # Module info
            "unitCatalogue": self.unitCatalogue,
            "wrapsHorizontally": self.moduleInfo["wrapsHorizontally"],
            "imageName": self.moduleInfo["imageName"],
            "moduleName": self.moduleName
        }

    def addPlayer(self, userId, countries):
        for country in countries:
            for c in self.countries:
                if country == c.name:
                    c.player = userId
                    break

    def isPlayersTurn(self, userId):
        return self.currentCountry.player == userId

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

    def territoryByName(self, name):
        for t in self.territories:
            if t.name == name:
                return t
        return None

    def getCountryByName(self, name):
        for c in self.countries:
            if c.name == name:
                return c
        return None

    def removeUnit(self, u):
        self.units.remove(u)

    def unitInfo(self, unitType):
        if unitType not in self.unitInfoDict:
            return None

        return self.unitInfoDict[unitType]