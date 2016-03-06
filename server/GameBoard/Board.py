import json
import itertools

from .Country import Country
from .Phases import BuyPhase
from .Territory import LandTerritory, SeaTerritory
from .Unit import UnitInfo, Unit
from . import Util
from .Components import Conflict


class Board:
    def __init__(self, moduleName):
        self.players = []
        self.units = []
        self.buyList = []
        self.moduleName = moduleName
        self.winningTeam = None
        self.resolvedConflicts = []

        # load json from module
        with open(Util.filePath(moduleName, "info.json")) as file:
            self.moduleInfo = json.load(file)

        with open(Util.countryFileName(moduleName)) as countryInfo:
            self.countries = [Country(c["name"], c["displayName"], c["team"], c["color"], c["playable"], self) for c in
                              json.load(countryInfo)]

        self.playableCountries = [c for c in self.countries if c.playable]

        with open(Util.unitFileName(moduleName)) as unitInfo:
            self.unitCatalogue = json.load(unitInfo)
            self.unitInfoDict = {unitType: UnitInfo(unitType, jsonInfo) for unitType, jsonInfo in
                                 self.unitCatalogue.items()}

        with open(Util.territoryFileName(moduleName)) as territoryInfo:
            self.territoryInfo = json.load(territoryInfo)

        self.territories = []
        for info in self.territoryInfo:
            if info["type"] == "land":
                startingCountry = self.getStartingCountry(info)
                self.territories.append(
                    LandTerritory(self, info["name"], info["displayName"], info["income"], startingCountry))
            elif info["type"] == "sea":
                self.territories.append(SeaTerritory(self, info["name"], info["displayName"]))
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
            for tName, unitTypes in unitSetup.items():
                territory = self.territoryByName(tName)
                assert territory is not None, "Invalid territory name %r" % tName
                for unitType in unitTypes:
                    self.units.append(Unit(self.unitInfo(unitType), territory.country, territory))

        # begin
        for c in self.playableCountries:
            c.collectIncome()
        self.currentCountry = self.playableCountries[0]

        self.currentPhase = BuyPhase(self.currentCountry.money, self)
        self.validateInfo()

    def validateInfo(self):
        for t in self.territories:
            if t.isLand():
                if t.country is None:
                    raise ("No country on " + t.displayName)
            if len(t.connections) == 0:
                raise ("No connections for " + t.displayName)

    def getStartingCountry(self, terInfo):
        if "country" not in terInfo:
            print("No country set for territory\n")
            print(terInfo)
            return
        for c in self.countries:
            if c.name == terInfo["country"]:
                return c

    def addPlayer(self, userId, countries):
        success = True
        for country in countries:
            success = self.addPlayerToCountry(userId, country) and success

        return success

    def addPlayerToCountry(self, userId, countryName):
        for c in self.countries:
            if countryName == c.name:
                c.player = userId
                return True

        print ("Cannot add player to country", countryName)
        return False

    def isPlayersTurn(self, userId):
        return self.currentCountry.player == userId

    def checkEliminations(self):
        self.eliminateCountries()
        self.checkVictory()

    def checkVictory(self):
        """
        If all but one team is eliminated, declares a game winner
        """
        remaining = [c for c in self.playableCountries if not c.eliminated]
        team = remaining[0].team
        teamWins = True
        for c in remaining:
            if c.team != team:
                teamWins = False
                break
        if teamWins:
            self.winningTeam = team

    def eliminateCountries(self):
        """
        Eliminates any countries that have no territories and no units left
        """
        for c in self.playableCountries:
            if c.eliminated:
                break
            eliminated = True
            for t in self.territories:
                if hasattr(t, "country") and t.country == c:
                    eliminated = False
                    break
            for u in self.units:
                if u.country == c:
                    eliminated = False
                    break
            if eliminated:
                c.eliminate()

    # Proceed to the next country's turn. This is different than advancing a phase (1/6th of a turn)
    def nextTurn(self):
        self.buyList = []
        for unit in self.units:
            unit.reset()

        for territory in self.territories:
            territory.reset()

        startingCountry = self.currentCountry
        self._nextCountry()
        while self.currentCountry.eliminated:
            self._nextCountry()
            if self.currentCountry == startingCountry:
                raise Exception("All other countries are eliminated")

    def _nextCountry(self):
        nextIndex = self.playableCountries.index(self.currentCountry) + 1
        if nextIndex >= len(self.playableCountries):
            self.currentCountry = self.playableCountries[0]
        else:
            self.currentCountry = self.playableCountries[nextIndex]

    def territoryUnits(self, t):
        unitList = []
        for u in self.units:
            if u.territory == t:
                unitList.append(u)
        return unitList

    def territoryByName(self, name):
        name = str(name)
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
        try:
            self.units.remove(u)
        except ValueError:
            print ("Error removing unit")
            print u.toDict()
            raise

    def unitById(self, id):
        for unit in self.units:
            if unit.id == id:
                return unit
        return None

    def unitInfo(self, unitType):
        if unitType not in self.unitInfoDict:
            return None
        return self.unitInfoDict[unitType]

    def computeConflicts(self):
        # conflict territories are land territories with enemy units, or a sea territory containing unallied untis
        def filterForConflicts(t):
            units = [u for u in self.units if u.movedToTerritory == t]
            if t.isLand():
                return len([u for u in units if not Util.allied(u, t)]) > 0
            else:
                containsUnallied = False
                for i, j in itertools.combinations(units, 2):
                    if not Util.allied(i, j):
                        containsUnallied = True
                        break
                return containsUnallied

        def getAttackers(territory):
            return [u for u in self.units if u.movedToTerritory == territory and Util.allied(u, self.currentCountry)]

        def getDefenders(territory):
            return [u for u in self.units if u.movedToTerritory == territory and not Util.allied(u, self.currentCountry)]

        allConflicts = [Conflict(self, t, getAttackers(t), getDefenders(t), None, None) for t in self.territories if filterForConflicts(t)]
        return filter(lambda conflict: not conflict.isStalemate(), allConflicts)

    def getFields(self, fieldNames):
        fieldValues = {}
        for field in fieldNames:
            fieldValues[field] = self.getField(field)
        return fieldValues

    def getField(self, fieldName):
        if fieldName == "countries":
            return [c.toDict() for c in self.countries]
        elif fieldName == "territoryInfo":
            return self.territoryInfo
        elif fieldName == "territoryOwners":
            return {t.name: {
                "current": t.country.name,
                "previous": t.previousCountry.name
            } for t in self.territories if hasattr(t, "country") and t.country is not None}
        elif fieldName == "connections":
            return self.connections
        elif fieldName == "units":
            return [u.toDict() for u in self.units]
        elif fieldName == "buyList":
            return [bought.toDict() for bought in self.buyList]
        elif fieldName == "conflicts":
            # current and past conflicts in reverse chronological order
            return [c.toDict() for c in self.computeConflicts() + list(reversed(self.resolvedConflicts))]

        elif fieldName == "currentPhase":
            return self.currentPhase.name
        elif fieldName == "currentCountry":
            return self.currentCountry.name

        elif fieldName == "unitCatalogue":
            return self.unitCatalogue
        elif fieldName == "wrapsHorizontally":
            return self.moduleInfo["wrapsHorizontally"]
        elif fieldName == "moduleName":
            return self.moduleName
        elif fieldName == "winningTeam":
            return self.winningTeam

        else:
            raise Exception("Unsupported field: " + fieldName)

    def toDict(self):
        allFields = [
            "countries",
            "territoryInfo",
            "territoryOwners",
            "connections",
            "units",
            "buyList",
            "conflicts",
            "currentPhase",
            "currentCountry",

            # Module info
            "unitCatalogue",
            "wrapsHorizontally",
            "moduleName",
            "winningTeam"
        ]
        return self.getFields(allFields)
