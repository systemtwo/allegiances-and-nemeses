from Country import Country
from Stages import BuyStage


class Board:
    def __init__(self):
        self.players = []
        self.territories = []
        self.units = []
        self.countries = []
        self.currentCountry = Country("Russia")
        self.stage = BuyStage(self.currentCountry)

def getPath(start, goal, unit):
    if start is goal:
        return []
    frontier = [(x, [start]) for x in start.connections]
    checked = []

    while len(frontier) > 0:
        (currentTerritory, path) = frontier.pop()
        if currentTerritory is goal:
            return path

        if canMoveThrough(unit, currentTerritory):
            newPath = path[:]
            newPath.append(currentTerritory)
            for t in currentTerritory.connections:
                if t not in checked:
                    frontier.append((t, newPath[:]))

        checked.append(currentTerritory)
    return None


def canMoveThrough(unit, territory):
    unitType = unit.type
    if allied(territory.country, unit.country):
        return True

    if isFlying(unitType):
        return True

    if unitType == "sub":
        # can move if no destroyers present
        if territory.containsUnitType("destroyer") == 0:
            return True

    if unitType == "tank":
        if len(territory.units()):
            return True

    return False


def isFlying(unitType):
    if unitType == "fighter" or unitType == "bomber":
        return True


def allied(a, b):
    return a.team == b.team