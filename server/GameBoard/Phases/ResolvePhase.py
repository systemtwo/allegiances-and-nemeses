from GameBoard.Conflict import ConflictOutcomes
from GameBoard.Phases.Phase import Phase


class ResolvePhase(Phase):
    # noinspection PyMissingConstructor
    def __init__(self, board):
        # dictionary of territory ->  list of units
        """
        :param board:
        """
        self.board = board
        self.name = "ResolvePhase"
        self.advanceIfFinished()

    def advanceIfFinished(self):
        if len(self.board.computeConflicts()) == 0:
            self.nextPhase()

    def autoResolve(self, conflictId):
        """
        attacks until either defenders or attackers are all dead
        :param conflictId: UUID
        :return: bool
        """

        conflict = next((conflict for conflict in self.board.computeConflicts()
                         if conflict.id == conflictId), None)
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
        self.advanceIfFinished()

    def autoResolveAll(self):
        for conflict in self.board.computeConflicts():
            self.autoResolve(conflict.id)

    def retreat(self, conflictTerritory, destination, unitIds):
        """
        send all attacking units to the destination territory
        dest must be a friendly territory adjacent to the conflict territory
        And in move range of the units ORIGINAL territory
        :param conflictTerritory: Territory territory to retreat from
        :param destination: Territory territory to retreat to
        :param unitIds: Ids of the units to move
        """
        pass

    def nextPhase(self):
        self.autoResolveAll()  # autoresolve any remaining conflicts

        self.board.checkEliminations()
        self.board.setPhase("MovementPhase")
