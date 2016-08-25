# Units are added to a moveList, but unit.territory does not get modified if they are attacking a territory.
# when they win, unit.territory is updated, and unit.originalTerritory is set
from GameBoard.Phases.BaseMovePhase import BaseMovePhase


class AttackPhase(BaseMovePhase):
    def __init__(self, board):
        BaseMovePhase.__init__(self, board)
        self.name = "AttackPhase"

    def nextPhase(self):
        BaseMovePhase.nextPhase(self)
        board = self.board
        board.setPhase("ResolvePhase")
