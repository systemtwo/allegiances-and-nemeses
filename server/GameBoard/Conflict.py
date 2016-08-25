"""
A conflict occurs when unallied units appear in the same territory, or a unit enters unallied territory
The possible outcomes are:
All defenders are killed, 1+ attackers live
    "Attacker Victory"
    All noncombatant defenders are killed
    if land and 1+ land attacker:
        "Occupation" - override victory
        Capture territory
        Capture neutral units
    if sea:
        "attackerWinWithCapture"
        Capture neutral units
All attackers are killed:
    if land:
        "Defended"
        All attacker non combatants are killed
        Capture neutrals
    if sea and 1+ defender:
        "Defended"
        All attacker non combatants are killed
        Capture neutrals
Sea, All attackers and all defenders are dead:
    "Draw"
    Do nothing
"""
import uuid
from GameBoard import Util

import Unit
import UniqueId

class Conflict(object):
    def __init__(self, board, territory, initialAttackers, initialDefenders,
                 attacker=None, defender=None, overrideId=None):
        """
        :param territory: Territory
        """
        self.territory = territory
        self.board = board
        self.id = UniqueId.getUniqueIdWithOverride(overrideId)

        if defender:
            self.defendingCountry = defender
        else:
            if territory.isLand():
                self.defendingCountry = territory.country
            else:
                # if it's a sea territory, there MUST be at least one defender
                self.defendingCountry = initialDefenders[0].country

        if attacker:
            self.attackingCountry = attacker
        else:
            self.attackingCountry = self.board.currentCountry

        self.attackers = [u for u in initialAttackers if not self.isNonCombatant(u) and not self.isNeutral(u)]
        self.defenders = [u for u in initialDefenders if not self.isNonCombatant(u) and not self.isNeutral(u)]
        self.nonCombatants = {
            'attackers': [u for u in initialAttackers if self.isNonCombatant(u)],
            'defenders': [u for u in initialDefenders if self.isNonCombatant(u)],
            'neutral': [u for u in initialAttackers + initialDefenders if self.isNeutral(u)]
        }
        self.reports = []
        self.outcome = ConflictOutcomes.inProgress

    def hasLandAttackers(self):
        hasLand = False
        for u in self.attackers:
            if u.isLand():
                hasLand = True
                break
        return hasLand

    # Performs a single step in a territory conflict
    # Takes in a list of attackers and defenders. Removes casualties from list
    def battle(self):
        keys = ["attack", "defence"]
        combatants = {
            "attack": self.attackers,
            "defence": self.defenders
        }
        # counts number of each side that must die
        scoredHits = {}
        for key in keys:
            scoredHits[key] = Util.calculateHits(combatants[key], key)

        casualties = {}
        for key in keys:
            if key == "attack":
                otherKey = "defence"
            else:
                otherKey = "attack"
            casualties[key] = Util.calculateCasualties(combatants[key], scoredHits[otherKey], key)

        self.outcome = self.getOutcome()
        self.handleOutcome()

        report = BattleReport(combatants, casualties)
        self.reports.append(report)
        # may want to revisit this
        for u in report.deadDefenders:
            self.board.removeUnit(u)
        for u in report.deadAttackers:
            self.board.removeUnit(u)
        return report

    def handleOutcome(self):
        # handle case where both sides have no combat value (unable to kill each other)
        if self.outcome == ConflictOutcomes.attackerWin:
            self._removeNonComs("defenders")

        elif self.outcome == ConflictOutcomes.attackerWinWithCapture:
            self._removeNonComs("defenders")
            self._convertNeutralUnits(self.board.currentCountry)

        elif self.outcome == ConflictOutcomes.occupationVictory:
            self._removeNonComs("defenders")
            self._convertNeutralUnits(self.board.currentCountry)
            # transfer ownership
            self.territory.country = self.board.currentCountry

        elif self.outcome == ConflictOutcomes.defenderWin:
            self._removeNonComs("attackers")
            self._convertNeutralUnits(self.defendingCountry)

        elif self.outcome == ConflictOutcomes.draw or self.outcome == ConflictOutcomes.inProgress:
            pass  # do nothing
        else:
            raise Exception("Unknown conflict outcome", self.outcome)

    def getOutcome(self):
        someAttackNoDef = len(self.defenders) == 0 and len(self.attackers) > 0
        if someAttackNoDef and self.territory.isLand and self.hasLandAttackers():
            return ConflictOutcomes.occupationVictory
        elif someAttackNoDef and self.territory.isSea():
            return ConflictOutcomes.attackerWinWithCapture
        elif someAttackNoDef and len(self.nonCombatants["defenders"]) > 0:
            return ConflictOutcomes.attackerWin
        elif len(self.attackers) == 0 and (self.territory.isLand or len(self.defenders) > 0):
            return ConflictOutcomes.defenderWin
        elif self.isStalemate():
            return ConflictOutcomes.draw
        else:
            return ConflictOutcomes.inProgress

    def isStalemate(self):
        combatSum = 0
        for u in self.attackers:
            combatSum += u.unitInfo.attack
        for u in self.defenders:
            combatSum += u.unitInfo.defence

        # an air or sea unit is not able to capture a land territory on their own, leading to a stalemate
        cannotCapture = len(self.defenders) == 0 and self.territory.isLand and not self.hasLandAttackers() and \
                        len(self.nonCombatants["defenders"]) == 0

        return combatSum == 0 or cannotCapture

    def isNonCombatant(self, unit):
        return ((self.territory.isLand() and unit.isSea()) or
                (self.territory.isSea() and unit.isLand()))

    def _removeNonComs(self, key):
        for u in self.nonCombatants[key]:
            self.board.removeUnit(u)

    def isNeutral(self, unit):
        return unit.type == "factory"

    def _convertNeutralUnits(self, country):
        for unit in self.nonCombatants["neutral"]:
            unit.country = country

    def toDict(self):
        return {
            "id": self.id.hex,
            "territoryName": self.territory.name,
            "attackers": [u.toDict() for u in self.attackers],
            "defenders": [u.toDict() for u in self.defenders],
            "defendingCountry": self.defendingCountry.name,
            "attackingCountry": self.attackingCountry.name,
            "reports": [r.toDict() for r in self.reports],
            "outcome": self.outcome
        }


# create a Conflict instance from a dictionary of info
def fromDict(conflictInfo, board):
    def countryByName(name):
        return Util.getByName(board.countries, name)

    def getUnit(unitId):
        return board.unitById(unitId)

    def getAllUnits(unitCollection):
        units = []
        for unit in unitCollection:
            unitId = uuid.UUID(unit["id"])
            unit = getUnit(unitId)
            if unit:
                units.append(unit)
            else:
                print("Could not load unit " + unitId.hex)

        return units

    def createUnits(unitInfoCollection):
        # Small issue - will create new instance of units that already exist
        return [Unit.createUnitFromDict(unitInfo, board.unitInfoDict, board.countries, board.territories) for unitInfo in unitInfoCollection]

    conflict = Conflict(board,
                        Util.getByName(board.territories, conflictInfo["territoryName"]),
                        getAllUnits(conflictInfo["attackers"]),
                        getAllUnits(conflictInfo["defenders"]),
                        countryByName(conflictInfo["attackingCountry"]),
                        countryByName(conflictInfo["defendingCountry"]),
                        uuid.UUID(conflictInfo["id"]))
    conflict.reports = [
        BattleReport(survivors={
            "attack": createUnits(report["survivingAttackers"]),
            "defence": createUnits(report["survivingDefenders"])
        }, casualties={
            "attack": createUnits(report["deadAttackers"]),
            "defence": createUnits(report["deadDefenders"])
        })
        for report in conflictInfo["reports"]
    ]
    conflict.outcome = conflictInfo["outcome"]
    return conflict


class ConflictOutcomes:
    inProgress = "inProgress"
    occupationVictory = "occupation"
    attackerWin = "attackerWin"
    attackerWinWithCapture = "attackerWinWithCapture"
    defenderWin = "defenderWin"
    draw = "draw"


class BattleReport:
    def __init__(self, survivors, casualties):
        self.survivingAttackers = survivors["attack"][:]
        self.survivingDefenders = survivors["defence"][:]
        self.deadAttackers = casualties["attack"][:]
        self.deadDefenders = casualties["defence"][:]

    def toDict(self):
        return {
            "survivingAttackers": [u.toDict() for u in self.survivingAttackers],
            "survivingDefenders": [u.toDict() for u in self.survivingDefenders],
            "deadAttackers": [u.toDict() for u in self.deadAttackers],
            "deadDefenders": [u.toDict() for u in self.deadDefenders]
        }
