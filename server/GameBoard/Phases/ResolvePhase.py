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
        if len(self.board.computeConflicts()) == 0:
            self.nextPhase()

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
        # TODO this early return should not be necessary
        # if all phases resolve automatically
        if self.board.currentCountry.eliminated:
            # will only happen if you attack and lose your last units, and have no territories
            # in that case, player's turn should end immediately
            self.board.nextTurn()
            self.board.setPhase("BuyPhase")
        else:
            self.board.setPhase("MovementPhase")
