import random
from Components import Conflict
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

    # deprecated
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


class BaseMovePhase(object):
    def __init__(self, board):
        self.board = board
        self.moveList = {}

    def moveUnits(self, units, destination):
        canMoveAll = True
        for unit in units:
            if not self.board.currentPhase.canMove(unit, destination):
                canMoveAll = False

        if canMoveAll:
            for unit in units:
                self.board.currentPhase.move(unit, destination)

        return canMoveAll

    def move(self, unit, destination):
        if self.canMove(unit, destination):
            self.moveList[unit] = (unit.territory, destination)
            return True
        else:
            return False

    def canMove(self, unit, destination):
        return Util.distance(unit.territory, destination, unit) is not -1


# Units are added to a moveList, but unit.territory does not get modified if they are attacking a territory.
# when they win, unit.territory is updated, and unit.originalTerritory is set
class AttackPhase(BaseMovePhase):
    def __init__(self, board):
        super(AttackPhase, self).__init__(board)
        self.name = "AttackPhase"

    def nextPhase(self):
        board = self.board
        # TODO conflict class
        hostileTerToAttackers = {}  # list of territories being attacked, and the attacking units
        for unit in self.moveList:
            (origin, dest) = self.moveList[unit]
            if not Util.allied(dest, unit.country):
                if dest not in hostileTerToAttackers:
                    hostileTerToAttackers[dest] = [unit]
                else:
                    hostileTerToAttackers[dest].append(unit)
            else:
                # not in conflict
                unit.originalTerritory = unit.territory
                unit.territory = dest

        board.attackMoveList = self.moveList
        if not hostileTerToAttackers:
            board.currentPhase = MovementPhase(board)
        else:
            conflicts = [Conflict(territory, attackers) for territory, attackers in hostileTerToAttackers.iteritems()]
            board.currentPhase = ResolvePhase(conflicts, board)
        return board.currentPhase


class ResolvePhase:
    def __init__(self, conflicts, board):
        # dictionary of territory ->  list of units
        """

        :param conflicts: List[Conflicts]
        :param board:
        """
        self.conflicts = conflicts
        self.board = board
        self.name = "ResolvePhase"
        self.currentConflict = None  # change to hold a conflict, not a territory

    def selectTerritory(self, territory):
        self.currentConflict = territory

    # TODO update logic. May autoresolve a partially resolved conflict
    def autoResolve(self, territory):
        """
        attacks until either defenders or attackers are all dead
        :param territory: Territory
        :return: bool
        """

        conflict = next((conflict for conflict in self.conflicts if conflict.territory == territory), None)
        if not conflict:
            return False  # or throw error

        defenders = territory.units()

        constraint = 100000
        while True:
            # bit of safety
            constraint -= 1
            if constraint == 0:
                print("Auto-resolve does not complete")
                break

            outcome = Util.battle(conflict.attackers, defenders)
            conflict.reports.append(outcome)
            for u in outcome.deadDefenders:
                self.board.removeUnit(u)

            if len(conflict.attackers) == 0:
                # defenders win
                conflict.resolution = Conflict.defenderWin
                break
            elif len(defenders) == 0:
                # attackers win if no defenders, and 1+ attackers
                conflict.resolution = Conflict.attackerWin

                # can only take the territory if 1+ attackers are land attackers
                landAttackers = [u for u in conflict.attackers if u.isLand()]
                if len(landAttackers) > 0:
                    territory.country = self.board.currentCountry

                # now we can update the attackers' current territory. They've officially moved in
                for u in conflict.attackers:
                    u.originalTerritory = u.territory
                    u.territory = territory
                break

    def autoResolveAll(self):
        for conflict in self.conflicts:  # TODO include current conflict
            self.autoResolve(conflict.territory)

        # TODO return all BattleReports

    def retreat(self, conflictTerritory, destination):
        """
        send all attacking units to the destination territory
        dest must be a friendly territory adjacent to the conflict territory
        some units may end up moving beyond their move limit
        This is alright. It's a valid exploit.
        Can only retreat from the current conflict. This means one battle tick must have happened
        :param conflictTerritory: Territory territory to retreat from
        :param destination: Territory territory to retreat to
        """
        assert(conflictTerritory == self.currentConflict)

    def nextPhase(self):
        unresolvedConflicts = [c for c in self.conflicts if c.resolution == Conflict.noResolution]
        if unresolvedConflicts:
            # throw error instead?
            raise NameError("Cannot advance to next phase before resolving conflicts")
        else:
            self.board.currentPhase = MovementPhase(self.board)
            return self.board.currentPhase


class MovementPhase(BaseMovePhase):
    def __init__(self, board):
        BaseMovePhase.__init__(self, board)  # dirty super
        self.name = "MovementPhase"

    # can move units that haven't moved in the attack phase, or planes that need to land
    # can't move into enemy territories
    def canMove(self, unit, destination):
        if not Util.allied(destination, unit.country):
            return False

        if unit not in self.board.attackMoveList:
            return super(MovementPhase, self).canMove(unit, destination)
        elif unit.isFlying():
            previousMove = Util.distance(unit.originalTerritory, unit.territory, unit)
            assert previousMove is not -1
            newMove = Util.distance(unit.territory, destination, unit)
            return newMove is not -1 and previousMove + newMove <= unit.unitInfo.movement

    def nextPhase(self):
        board = self.board
        board.neutralMoveList = self.moveList
        board.currentPhase = PlacementPhase(board)
        return board.currentPhase


class PlacementPhase:
    def __init__(self, board):
        self.toPlace = board.buyList[:]  # list of units to place on the board
        self.placedList = []
        self.name = "PlacementPhase"

    def place(self, unitType, territory, board):
        if unitType in self.toPlace and territory.hasFactory():
            alreadyPlaced = [u for u in self.placedList if u.territory == territory]
            if len(alreadyPlaced) < territory.income:
                newUnit = Unit(board.unitInfo(unitType), board.currentCountry, territory)
                self.toPlace.remove(unitType)
                self.placedList.append(newUnit)

    def nextPhase(self, board):
        for u in self.placedList:
            board.units.append(u)
        board.currentCountry.colllectIncome()

        board.nextTurn()
        board.currentPhase = BuyPhase(board.currentCountry, board)
        return board.currentPhase