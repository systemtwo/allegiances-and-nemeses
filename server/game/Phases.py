import random
from Unit import Unit
import Util


"""
Phases handle the major operational logic of the game. Each phase it's own unique logic, and different available actions
Every phase has a nextPhase method, that progresses to the next phase.
The methods for each phase validate client actions, then perform the requested action.
Actions available to the user are computed by Phase objects on client side, not server side.

The six phases are:
Buy -> purchase units to place later
Attack -> Move units into enemy territories
Resolve -> Units in any territory under attack must fight until one side is dead, or the attacker retreats
Neutral Move -> Planes must land, units that haven't moved can move to friendly territories.
Placement -> Place the units bought at the beginning of the turn
Collect Income -> Collect income from all the territories owned (including conquered territories)
"""


class BuyPhase:
    def __init__(self, ipc, board):
        # List[(unitType, cost)]
        self.buyList = []
        self.moneyCap = ipc
        self.board = board
        self.name = "BuyPhase"

    def buyUnit(self, unitType):
        info = self.board.unitInfo(unitType)
        if self.money() + info.cost <= self.moneyCap:
            self.buyList.append((unitType, info.cost))

    def setBuyList(self, buyList):
        sumCost = 0
        unitList = []
        # buyList is of type [{unitType: String, amount: int}]
        for buyInfo in buyList:
            unitInfo = self.board.unitInfo(buyInfo["unitType"])
            sumCost += buyInfo["amount"] * unitInfo.cost
            for _ in range(buyInfo["amount"]):
                unitList.append((buyInfo["unitType"], unitInfo.cost))

        if sumCost <= self.moneyCap:
            self.buyList = unitList
            return True
        else:
            return False

    def cancel(self, unitType):
        for x in self.buyList:
            if x[0] == unitType:
                self.buyList.remove(x)
                break

    def money(self):
        total = 0
        for (unitType, cost) in self.buyList:
            total += cost
        return total

    def nextPhase(self):
        board = self.board
        board.buyList = [unitType for (unitType, cost) in self.buyList]
        board.currentPhase = AttackPhase(board)
        return board.currentPhase


class BaseMovePhase:
    def __init__(self, board):
        self.board = board
        self.moveList = {}

    def move(self, unit, destination):
        if self.canMove(unit, destination):
            self.moveList[unit] = (unit.territory, destination)
            return True
        else:
            return False

    def canMove(self, unit, destination):
        return len(self.board.getPath(unit.territory, destination, unit)) <= self.board.unitInfo(unit.type).movement + 1


# Units are added to a moveList, but unit.territory does not get modified if they are attacking a territory.
# when they win, unit.territory is updated, and unit.previousTerritory is set
class AttackPhase(BaseMovePhase):
    def __init__(self, board):
        super().__init__(board)
        self.name = "AttackPhase"

    def nextPhase(self):
        board = self.board
        # TODO conflict class
        conflicts = {}  # list of territories being attacked, and the attacking units
        for (unit, start, dest) in self.moveList:
            if not Util.allied(dest.country, unit.country):
                if dest not in conflicts:
                    conflicts[dest] = [unit]
                else:
                    conflicts[dest].append(unit)
            else:
                # not in conflict
                unit.previousTerritory = unit.territory
                unit.territory = dest

        board.attackMoveList = self.moveList
        board.currentPhase = ResolvePhase(conflicts, self.board)
        return board.currentPhase


class ResolvePhase:
    def __init__(self, conflicts, board):
        # dictionary of territory ->  list of units
        self.unresolvedConflicts = conflicts
        self.resolvedConflicts = []
        self.board = board
        self.name = "ResolvePhase"
        self.currentConflict = None  # change to hold a conflict, not a territory

    def selectTerritory(self, territory):
        self.currentConflict = territory

    # attacks until either defenders or attackers are all dead
    # TODO update logic. May autoresolve a partially resolved conflict
    def autoResolve(self, territory):
        if not territory in self.unresolvedConflicts:
            return False

        defenders = territory.units()
        attackers = self.unresolvedConflicts[territory]

        outcomes = []  # list of battle reports
        constraint = 100000
        while True:
            # bit of safety
            constraint -= 1
            if constraint == 0:
                print("Auto-resolve does not complete")
                break

            outcome = self.battle(attackers, defenders)
            outcomes.append(outcome)
            for u in outcome.deadAttackers + outcome.deadDefenders:
                self.board.removeUnit(u)

            if len(attackers) == 0:
                # defenders win
                self.resolvedConflicts.append((territory, outcomes, defenders))
                break
            elif len(defenders) == 0:
                # attackers win if no defenders, and 1+ attackers
                self.resolvedConflicts.append((territory, outcomes, attackers))

                # can only take the territory if 1+ attackers are land attackers
                landAttackers = [u for u in attackers if u.isLand()]
                if len(landAttackers) > 0:
                    territory.country = self.board.currentCountry

                # now we can update the attackers' current territory. They've officially moved in
                for u in attackers:
                    u.previousTerritory = u.territory
                    u.territory = territory
                break

    def autoResolveAll(self):
        for tName, conflict in self.unresolvedConflicts:  # TODO include current conflict
            self.autoResolve(tName)

        # TODO return all BattleReports

    # Performs a single step in a territory conflict
    # Takes in a list of attackers and defenders. Removes casualties from list
    def battle(self, attackers, defenders):
        # counts number of each side that must die
        attackingCasualties = 0
        defendingCasualties = 0

        # there's a weighted chance of each unit dying. We sum the weights for all the attackers and defenders
        sumAttackers = 0
        sumDefenders = 0

        # Calculate hits. Chance for a hit is attack/6 for attackers, defence/6 for defenders
        for u in attackers:
            info = self.board.unitInfo(u.type)
            sumAttackers += 1.0 / info.attack
            if random.randint(1, 6) <= info.attack:
                defendingCasualties += 1

        for u in defenders:
            info = self.board.unitInfo(u.type)
            sumDefenders += 1.0 / info.defence
            if random.randint(1, 6) <= info.defence:
                attackingCasualties += 1

        # kill random peeps. chance of dying is 1/attack or 1/defence
        # using the sum of the weights, we take a random number that's less than the sum
        # Then we add up the weights of each unit until the total exceeds our random number
        # That unlucky unit is now dead
        deadA = []
        deadD = []
        while defendingCasualties > 0:
            defendingCasualties -= 1
            runningTotal = 0
            rand = random.random() * sumDefenders
            for d in defenders:
                defence = self.board.unitInfo(d).defence
                if defence > 0:
                    runningTotal += 1.0 / defence
                    if runningTotal >= rand:
                        deadD.append(d)
                        defenders.remove(d)
                        break

        while attackingCasualties > 0:
            attackingCasualties -= 1
            runningTotal = 0
            rand = random.random() * sumAttackers
            for a in attackers:
                attack = self.board.unitInfo(a).attack
                if attack > 0:
                    runningTotal += 1.0 / attack
                    if runningTotal >= rand:
                        deadA.append(a)
                        attackers.remove(a)
                        break
        return BattleReport(attackers, defenders, deadA, deadD)

    def retreat(self, conflictTerritory, destination):
        """
        send all attacking units to the destination territory
        dest must be a friendly territory adjacent to the conflict territory
        some units may end up moving beyond their move limit
        This is alright. It's a valid exploit.
        Can only retreat from the current conflict. This means one battle tick must have happened
        """
        assert(conflictTerritory == self.currentConflict)

    def nextPhase(self):
        if len(self.unresolvedConflicts) > 0:
            return None
        else:
            self.board.currentPhase = MovementPhase(self.board)
            return self.board.currentPhase


class BattleReport:
    def __init__(self, attackers, defenders, deadAttack, deadDefend):
        self.survivingAttackers = attackers
        self.survivingDefenders = defenders
        self.deadAttackers = deadAttack
        self.deadDefenders = deadDefend


class MovementPhase(BaseMovePhase):
    def __init__(self, board):
        super().__init__(board)
        self.name = "MovementPhase"

    # can move units that haven't moved in the attack phase, or planes that need to land
    # can't move into enemy territories
    def canMove(self, unit, destination):
        if not Util.allied(destination.country, unit.country):
            return False

        if unit not in self.board.attackMoveList:
            return super(self).canMove(unit, destination)
        elif unit.isFlying():
            previousMove = self.board.getPath(unit.previousTerritory, unit.territory, unit)
            newMove = self.board.getPath(unit.territory, destination, unit)
            return previousMove + newMove < self.board.unitInfo(unit.type).movement

    def nextPhase(self):
        board = self.board
        board.neutralMoveList = self.moveList
        board.currentPhase = PlacementPhase(board)
        return board.currentPhase


class PlacementPhase:
    def __init__(self, board):
        self.toPlace = board.buyList.copy()  # list of units to place on the board
        self.placedList = []
        self.name = "PlacementPhase"

    def place(self, unitType, territory, board):
        if unitType in self.toPlace and territory.hasFactory():
            alreadyPlaced = [u for u in self.placedList if u.territory == territory]
            if len(alreadyPlaced) < territory.income:
                newUnit = Unit(unitType, board.currentCountry, territory)
                self.toPlace.remove(unitType)
                self.placedList.append(newUnit)

    def nextPhase(self, board):
        for u in self.placedList:
            board.units.append(u)
        board.currentCountry.colllectIncome()

        board.nextTurn()
        board.currentPhase = BuyPhase(board.currentCountry, board)
        return board.currentPhase