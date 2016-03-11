import itertools

from .Phases import BuyPhase, AttackPhase, ResolvePhase, MovementPhase, PlacementPhase
from . import Util
from .Conflict import Conflict

class Board:
    def __init__(self, players, unitInfoDict, territories, units, countries, phaseName=None):
        self.players = players
        self.units = units
        self.buyList = []
        self.winningTeam = None
        self.resolvedConflicts = []

        self.countries = countries
        self.playableCountries = [c for c in countries if c.playable]
        self.territories = territories
        self.unitInfoDict = unitInfoDict

        # begin
        for c in self.playableCountries:
            self.collectIncome(c)
        self.currentCountry = self.playableCountries[0]

        if phaseName:
            if phaseName == "BuyPhase":
                self.currentPhase = BuyPhase(self)
            elif phaseName == "AttackPhase":
                self.currentPhase = AttackPhase(self)
            elif phaseName == "ResolvePhase":
                self.currentPhase = ResolvePhase(self)
            elif phaseName == "MovementPhase":
                self.currentPhase = MovementPhase(self)
            elif phaseName == "PlacementPhase":
                self.currentPhase = PlacementPhase(self)
        else:
            self.currentPhase = BuyPhase(self)

        self.validateInfo()

    def validateInfo(self):
        for t in self.territories:
            if t.isLand():
                if t.country is None:
                    raise ("No country on " + t.displayName)
            if len(t.connections) == 0:
                raise ("No connections for " + t.displayName)

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

    def collectIncome(self, country):
        for t in self.territories:
            if t.isLand() and t.country == country:
                country.money += t.income

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

    def removeUnit(self, u):
        try:
            self.units.remove(u)
        except ValueError:
            print ("Error removing unit")
            print u.toDict()
            raise

    def unitById(self, unitId):
        for unit in self.units:
            if unit.id == unitId:
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
                return len([u for u in units if not Util.allied(u, t, units)]) > 0
            else:
                containsUnallied = False  # whether there a units from two different teams in a single territory
                for i, j in itertools.combinations(units, 2):
                    if not Util.alliedCountries(i.country, j.country):
                        containsUnallied = True
                        break
                return containsUnallied

        def getAttackers(territory):
            return [u for u in self.units
                    if u.movedToTerritory == territory and Util.alliedCountries(u.country, self.currentCountry)]

        def getDefenders(territory):
            return [u for u in self.units if
                    u.movedToTerritory == territory and not Util.alliedCountries(u.country, self.currentCountry)]

        allConflicts = [Conflict(self, t, getAttackers(t), getDefenders(t), None, None) for t in self.territories if
                        filterForConflicts(t)]
        return filter(lambda conflict: not conflict.isStalemate(), allConflicts)
