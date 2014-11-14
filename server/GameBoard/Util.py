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


# Checks if a unit can move through a territory
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