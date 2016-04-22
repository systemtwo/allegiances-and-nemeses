from GameBoard import GameHelpers
from GameBoard.Phases.BaseMovePhase import BaseMovePhase


class MovementPhase(BaseMovePhase):
    def __init__(self, board):
        BaseMovePhase.__init__(self, board)
        self.name = "MovementPhase"

    # can move units that haven't moved in the attack phase, or planes that need to land
    # can't move into enemy territories
    def canMove(self, unit, destination):
        if not GameHelpers.allied(destination, unit.country, self.board.units) \
                or not BaseMovePhase.canMove(self, unit, destination):
            return False

        if unit.isFlying():
            # Gotta have an airport to land in or sometin
            if hasattr(destination, "previousCountry") and not GameHelpers.alliedCountries(destination.previousCountry, unit.country):
                return False

            previousMove = GameHelpers.calculateDistance(unit.originalTerritory, unit.territory, unit, self.board.units)
            assert previousMove is not -1
            newMove = GameHelpers.calculateDistance(unit.territory, destination, unit, self.board.units)
            return newMove is not -1 and previousMove + newMove <= unit.unitInfo.movement
        else:
            return not unit.hasMoved()

    def nextPhase(self):
        BaseMovePhase.nextPhase(self)
        board = self.board
        board.setPhase("PlacementPhase")
