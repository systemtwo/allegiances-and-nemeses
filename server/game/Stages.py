from Unit import findUnitInfo


class BuyStage:
    def __init__(self, ipc):
        # List[(unitType, cost)]
        self.buyList = []
        self.moneyCap = ipc

    def buyUnit(self, unitType):
        unitInfo = findUnitInfo(unitType)
        if self.money() + unitInfo.cost <= self.moneyCap:
            self.buyList.append((unitType, unitInfo.cost))

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

    def nextStage(self, board):
        board.buyList = self.buyList
        board.stage = AttackStage(board)


def canMove(unit, destination):
    # need checks for clear friendly path/unit is sub or aircraft
    unit.territory.distance(destination) <= findUnitInfo(unit.type).movement


class AttackStage:
    def __init__(self, board):
        self.board = board
        self.moveList = []

    def move(self, unit, destination):
        if canMove(unit, destination):
            self.moveList.append((unit, unit.territory, destination))

    def nextStage(self):
        conflicts = {} # list of territories being attacked, and the attacking units
        for (unit, start, dest) in self.moveList:
            if unit.country is not dest.country:
                if dest not in conflicts:
                    conflicts[dest] = [unit]
                else:
                    conflicts[dest].append(unit)

        self.board.stage = ResolveStage(conflicts)


class ResolveStage:
    def __init__(self, conflicts):
        # dictionary of territory ->  list of units
        self.conflicts = conflicts

    def battle(self, attackers, defenders):
        pass


class MovementStage:
    def __init__(self):
        pass


class PlacementStage:
    def __init__(self):
        pass