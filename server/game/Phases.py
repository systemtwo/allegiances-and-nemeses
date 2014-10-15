import random
from Unit import Unit


class BuyPhase:
    def __init__(self, ipc, board):
        # List[(unitType, cost)]
        self.buyList = []
        self.moneyCap = ipc
        self.board = board

    def buyUnit(self, unitType):
        info = self.board.unitInfo(unitType)
        if self.money() + info.cost <= self.moneyCap:
            self.buyList.append((unitType, info.cost))

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

    def nextPhase(self, board):
        board.buyList = [unitType for (unitType, cost) in self.buyList]
        board.currentPhase = AttackPhase(board)
        return board.currentPhase


class BaseMovePhase:
    def __init__(self, board):
        self.board = board
        self.moveList = []

    def move(self, unit, destination):
        if self.canMove(unit, destination):
            self.moveList.append((unit, unit.territory, destination))

    def canMove(self, unit, destination):
        return self.board.getPath(unit.territory, destination, unit) <= self.board.unitInfo(unit.type).movement


class AttackPhase(BaseMovePhase):
    def nextPhase(self, board):
        conflicts = {}  # list of territories being attacked, and the attacking units
        for (unit, start, dest) in self.moveList:
            if unit.country is not dest.country:
                if dest not in conflicts:
                    conflicts[dest] = [unit]
                else:
                    conflicts[dest].append(unit)

        board.attackMoveList = self.moveList
        board.currentPhase = ResolvePhase(conflicts, self.board)
        return board.currentPhase


class ResolvePhase:
    def __init__(self, conflicts, board):
        # dictionary of territory ->  list of units
        self.unresolvedConflicts = conflicts
        self.resolvedConflicts = []
        self.board = board

    # attacks until either defenders or attackers are all dead
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
                print("Aut-resolve does not complete")
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
                # attackers win
                self.resolvedConflicts.append((territory, outcomes, attackers))
                territory.country = self.board.currentCountry
                for u in attackers:
                    u.territory = territory
                break

    # Takes in a list of attackers and defenders. Removes casualties from list
    def battle(self, attackers, defenders):
        attackingCasualties = 0
        defendingCasualties = 0

        sumAttackers = 0
        sumDefenders = 0

        # Calculate hits. Chance for a hit is attack/6 for attackers, defence/6 for defenders
        for u in attackers:
            info = self.board.unitInfo(u.type)
            sumAttackers += 1.0/info.attack
            if random.randint(1, 6) <= info.attack:
                defendingCasualties += 1

        for u in defenders:
            info = self.board.unitInfo(u.type)
            sumDefenders += 1.0/info.defence
            if random.randint(1, 6) <= info.defence:
                attackingCasualties += 1

        # kill random peeps. chance of dying is 1/attack or 1/defence
        deadA = []
        deadD = []
        while defendingCasualties > 0:
            defendingCasualties -= 1
            runningTotal = 0
            rand = random.random()*sumDefenders
            for d in defenders:
                defence = self.board.unitInfo(d).defence
                if defence > 0:
                    runningTotal += 1.0/defence
                    if runningTotal >= rand:
                        deadD.append(d)
                        defenders.remove(d)
                        break

        while attackingCasualties > 0:
            attackingCasualties -= 1
            runningTotal = 0
            rand = random.random()*sumAttackers
            for a in attackers:
                attack = self.board.unitInfo(a).attack
                if attack > 0:
                    runningTotal += 1.0/attack
                    if runningTotal >= rand:
                        deadA.append(a)
                        attackers.remove(a)
                        break
        return BattleReport(attackers, defenders, deadA, deadD)

    def nextPhase(self, board):
        if len(self.unresolvedConflicts) > 0:
            return None
        else:
            board.currentPhase = MovementPhase(board)
            return board.currentPhase


class BattleReport:
    def __init__(self, attackers, defenders, deadAttack, deadDefend):
        self.survivingAttackers = attackers
        self.survivingDefenders = defenders
        self.deadAttackers = deadAttack
        self.deadDefenders = deadDefend


class MovementPhase(BaseMovePhase):
    def canMove(self, unit, destination):
        return unit not in self.board.attackMoveList and super(self).canMove(unit, destination)

    def nextPhase(self, board):
        board.neutralMoveList = self.moveList
        board.currentPhase = PlacementPhase(board.buyList)
        return board.currentPhase


class PlacementPhase:
    def __init__(self, units):
        self.unitList = units
        self.placeList = []

    def place(self, unitType, territory, board):
        if unitType in self.unitList and territory.hasFactory():
            alreadyPlaced = [u for u in self.placeList if u.territory == territory]
            if len(alreadyPlaced) < territory.income:
                newUnit = Unit(unitType, board.currentCountry, territory)
                self.unitList.remove(unitType)
                self.placeList.append(newUnit)

    def nextPhase(self, board):
        for u in self.placeList:
            board.units.append(u)
        board.currentCountry.colllectIncome()

        board.nextTurn()
        board.currentPhase = BuyPhase(board.currentCountry)
        return board.currentPhase