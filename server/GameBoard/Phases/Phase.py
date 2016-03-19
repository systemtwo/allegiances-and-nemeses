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

class Phase:
    def __init__(self, board):
        pass

    def nextPhase(self):
        pass


# noinspection PyClassHasNoInit
class PhaseNames:
    BuyPhase = "BuyPhase"
    AttackPhase = "AttackPhase"
    ResolvePhase = "ResolvePhase"
    MovementPhase = "MovementPhase"
    PlacementPhase = "PlacementPhase"
