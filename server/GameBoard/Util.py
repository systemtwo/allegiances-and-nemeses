import os
import config

def unitFileName(moduleName):
    return filePath(moduleName, "UnitList.json")


def countryFileName(moduleName):
    return filePath(moduleName, "CountryList.json")


def territoryFileName(moduleName):
    return filePath(moduleName, "TerritoryList.json")


def connectionFileName(moduleName):
    return filePath(moduleName, "connections.json")


def filePath(moduleName, fileName):
    return os.path.join(config.ABS_MODS_PATH, moduleName, fileName)


def isFlying(unitType):
    if unitType == "fighter" or unitType == "bomber":
        return True


def allied(a, b):
    return a.team == b.team


# Finds the distance from the start to the goal, based on the unit's type and country
# -1 if movement not possible
def distance(start, goal, unit):
    if start is goal:
        return 0
    frontier = [(x, 1) for x in start.connections if unit.canMoveInto(x)]
    checked = []

    while len(frontier) > 0:
        (currentTerritory, steps) = frontier.pop(0)
        if currentTerritory is goal:
            return steps

        if unit.canMoveThrough(currentTerritory) and steps < unit.unitInfo.movement:
            for t in currentTerritory.connections:
                if t not in checked and unit.canMoveInto(t):
                    frontier.append((t, steps + 1))

        checked.append(currentTerritory)
    return -1