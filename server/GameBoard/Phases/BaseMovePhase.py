from GameBoard import GameHelpers
from GameBoard.Phases.Phase import Phase


class BaseMovePhase(Phase):
    # noinspection PyMissingConstructor
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
            return GameHelpers.calculateDistance(unit.territory, destination, unit, self.board.units)
        return unit.country is self.board.currentCountry and getDistance() is not -1

    def nextPhase(self):
        # move all units without conflicts
        for unit in self.moveList:
            (origin, dest) = self.moveList[unit]
            # not in conflict
            unit.territory = dest
