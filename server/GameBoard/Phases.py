from .Components import ConflictOutcomes
from .Unit import Unit, BoughtUnit
from . import Util

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
    def __init__(self, money, board):
        # List[(unitType, cost)]
        self.buyList = []
        self.moneyCap = money
        self.board = board
        self.name = "BuyPhase"

    def setBuyList(self, buyList):
        """
        Sets the buy list for the board
        :param buyList: Array of BoughtUnits or Objects containing unitType and territory (the name of the territory)
        :return:
        """
        parsedBuyList = []
        for bought in buyList:
            if hasattr(bought, "unitType"):
                parsedBuyList.append(bought)
            elif isinstance(bought, dict) and u'unitType' in bought and u'territory' in bought:
                territory = Util.getByName(self.board.territories, bought[u"territory"])
                parsedBuyList.append(BoughtUnit(bought[u"unitType"], territory))
            else:
                raise Exception("Invalid buy list", buyList)

        sumCost = self.costOfUnits(parsedBuyList)

        if sumCost <= self.moneyCap:
            self.board.buyList = parsedBuyList[:]  # copy in buyList
            return True
        else:
            return False

    def costOfUnits(self, unitList):
        sumCost = 0
        # buyList is of type [{unitType: String, amount: int}]
        for bought in unitList:
            unitInfo = self.board.unitInfo(bought.unitType)
            sumCost += unitInfo.cost
        return sumCost

    def money(self):
        return self.costOfUnits(self.buyList)

    def nextPhase(self):
        board = self.board
        board.currentCountry.pay(self.costOfUnits(board.buyList))
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
            unit.movedToTerritory = destination  # update the unit, affects client only
            self.moveList[unit] = (unit.territory, destination)
            return True
        else:
            return False

    def canMove(self, unit, destination):
        def getDistance():
            return Util.calculateDistance(unit.territory, destination, unit, self.board.units)
        return  unit.country is self.board.currentCountry and getDistance() is not -1


# Units are added to a moveList, but unit.territory does not get modified if they are attacking a territory.
# when they win, unit.territory is updated, and unit.originalTerritory is set
class AttackPhase(BaseMovePhase):
    def __init__(self, board):
        super(AttackPhase, self).__init__(board)
        self.name = "AttackPhase"

    def nextPhase(self):
        board = self.board

        # move all units without conflicts
        for unit in self.moveList:
            (origin, dest) = self.moveList[unit]
            # not in conflict
            unit.territory = dest
        board.currentPhase = ResolvePhase(board)
        return board.currentPhase


class ResolvePhase:
    def __init__(self, board):
        # dictionary of territory ->  list of units
        """
        :param board:
        """
        self.board = board
        self.name = "ResolvePhase"

    def autoResolve(self, territory):
        """
        attacks until either defenders or attackers are all dead
        :param territory: Territory
        :return: bool
        """

        conflict = next((conflict for conflict in self.board.computeConflicts()
                         if conflict.territory == territory), None)
        if not conflict:
            return False  # or throw error

        self.board.currentConflict = conflict # test code

        constraint = 1000
        while conflict.outcome == ConflictOutcomes.inProgress:
            # bit of safety
            constraint -= 1
            if constraint == 0:
                print("Auto-resolve does not complete")
                break

            conflict.battle()

        self.board.resolvedConflicts.append(conflict)

    def autoResolveAll(self):
        for conflict in self.board.computeConflicts():
            self.autoResolve(conflict.territory)

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
        pass

    def nextPhase(self):
        self.autoResolveAll()  # autoresolve any remaining conflicts

        self.board.checkEliminations()
        if self.board.currentCountry.eliminated:
            # will only happen if you attack and lose your last units, and have no territories
            # in that case, player's turn should end immediately
            self.board.nextTurn()
            self.board.currentPhase = BuyPhase(self.board.currentCountry.money, self.board)
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
        if not Util.allied(destination, unit.country) \
                or not super(MovementPhase, self).canMove(unit, destination):
            return False

        if unit.isFlying():
            # Gotta have an airport to land in or sometin
            if hasattr(destination, "previousCountry") and not Util.allied(destination.previousCountry, unit.country):
                return False

            previousMove = Util.calculateDistance(unit.originalTerritory, unit.territory, unit, self.board.units)
            assert previousMove is not -1
            newMove = Util.calculateDistance(unit.territory, destination, unit, self.board.units)
            return newMove is not -1 and previousMove + newMove <= unit.unitInfo.movement
        else:
            return not unit.hasMoved()

    def nextPhase(self):
        board = self.board
        for unit in self.moveList:
            (origin, dest) = self.moveList[unit]
            unit.territory = dest
        board.currentPhase = PlacementPhase(board)
        return board.currentPhase


class PlacementPhase:
    def __init__(self, board):
        self.toPlace = board.buyList[:]  # list of units to place on the board
        self.board = board
        self.name = "PlacementPhase"

    def setBuyList(self, buyList):
        """
        Updates the buyList with where units should be place
        Does not allow the more units to be bought or sold
        :param buyList: Array of BoughtUnits or Objects containing unitType and territory (the name of the territory)
        :return:
        """
        currentListCopy = self.board.buyList[:]

        parsedBuyList = []
        for bought in buyList:
            if hasattr(bought, "unitType"):
                boughtUnit = bought
            elif isinstance(bought, dict) and u'unitType' in bought and u'territory' in bought:
                territory = Util.getByName(self.board.territories, bought[u"territory"])
                boughtUnit = BoughtUnit(bought[u"unitType"], territory)
            else:
                raise Exception("Invalid buy list", buyList)

            if boughtUnit in currentListCopy:
                currentListCopy.remove(boughtUnit)
                parsedBuyList.append(boughtUnit)
            else:
                raise Exception("Sneaky bugger trying to change the buy list")

        self.board.buyList = parsedBuyList[:]  # copy in buyList
        return True  # true for success, to match setBuyList in the buy phase

    def nextPhase(self):
        for u in self.board.buyList:
            unitInfo = self.board.unitInfo(u.unitType)
            if u.territory is not None:
                self.board.units.append(Unit(unitInfo, self.board.currentCountry, u.territory))
        self.board.collectIncome(self.board.currentCountry)

        self.board.nextTurn()
        self.board.currentPhase = BuyPhase(self.board.currentCountry.money, self.board)
        return self.board.currentPhase
