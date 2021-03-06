import os
import random
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


def allied(a, b, relevantUnits):
    """
    Returns true if a is allied to b
    :param a: Accepts a land or sea territory instance, a unit instance, or a country instance
    :param b:
    :param relevantUnits: When determining if a sea territory is allied to a country, it is necessary to check if any
    unallied units are in that territory
    :return:
    """
    if hasattr(a, "country"):
        a = a.country
    if hasattr(b, "country"):
        b = b.country

    # doesn't have attr country, and doesn't have a team
    if not hasattr(a, "team"):
        return friendlySeaTerritory(a, b, relevantUnits)
    elif not hasattr(b, "team"):
        return friendlySeaTerritory(b, a, relevantUnits)
    else:
        return alliedCountries(a, b)

def alliedCountries(a, b):
    return a.team == b.team


def friendlySeaTerritory(sea, country, relevantUnits):
    return len(enemyUnits(relevantUnits, country, sea)) == 0


def calculateDistance(start, goal, unit, allUnits):
    """
    Finds the distance from the start to the goal, based on the unit's type and country
    :param start: Territory to start from
    :param goal: Terriotry to get to
    :param unit: The unit to calculate the distance for. Different unit types will move differently
    :param allUnits: All units on the board. Needed for determining if a territory contains enemy units
    :return:
        Number of territories for a flying unit
        Dictionary of number of land and sea moves for any other unit
        -1 if movement not possible
    """
    frontier = [(start, _initialDistance(unit))]
    checked = []

    while len(frontier) > 0:
        (currentTerritory, steps) = frontier.pop(0)
        if currentTerritory is goal:
            return steps

        if canMoveThrough(unit, currentTerritory, allUnits):
            for t in currentTerritory.connections:
                newSteps = _incrementDistance(unit, currentTerritory, t, steps)
                if t not in checked:
                    frontier.append((t, newSteps))

        checked.append(currentTerritory)
    return -1


def _initialDistance(unit):
    if unit.isFlying():
        return 0
    else:
        return {
            'land': 0,
            'sea': 0
        }


def _incrementDistance(unit, origin, destination, distance):
    if unit.isFlying():
        return distance + 1
    else:
        newLand = distance["land"] + \
            (1 if origin.isLand() or destination.isLand() else 0)
        newSea = distance["sea"] + \
            (1 if origin.isSea() or destination.isSea() else 0)
        return {
            'land': newLand,
            'sea': newSea
        }

def _distanceInRange(unit, distance):
    if unit.isFlying():
        return distance <= unit.movement
    else:
        return distance.sea <= unit.unitInfo.seaMove and distance.land <= unit.unitInfo.landMove


def calculateHits(units, combatValueKey):
    # Calculate hits. Chance for a hit is attack/6 for attackers, defence/6 for defenders
    scoredHits = 0
    for u in units:
        randomRoll = random.randint(1, 6)
        if randomRoll <= u.unitInfo[combatValueKey]:
            scoredHits += 1
    return scoredHits


def totalDeathProbability(units, combatValueKey):
    total = 0
    for u in units:
        total += getDeathProbability(u, combatValueKey)
    return total

def getDeathProbability(unit, combatValueKey):
    return 1.0 / (unit.unitInfo[combatValueKey] + 0.1)  # adding 0.1 fixes 0 combat value case


def calculateCasualties(units, hits, combatValueKey):
    # there's a weighted chance of each unit dying. We sum the weights for all the units
    """
    Calculates which units will die and removes them from the list of units
    :param units: The units that must suffer casualties
    :param hits: The number of units to kill. If greater than the number of units,
    :param combatValueKey: Use the attack or defence combat values
    :return: Array of the units killed
    """
    casualties = []
    summedHitChance = totalDeathProbability(units, combatValueKey)

    # kill random peeps. chance of dying is 1/(attack+0.1) or 1/(defence+0.1)
    # using the sum of the weights, we take a random number that's less than the sum
    # Then we add up the weights of each unit until the total exceeds our random number
    # That unlucky unit is now dead
    previousNumHits = -1  # use this variable to make sure someone dies every loop
    while hits > 0 and summedHitChance > 0:
        assert previousNumHits != hits
        previousNumHits = hits

        rand = random.random() * summedHitChance
        runningTotal = 0
        for unit in units:
            runningTotal += getDeathProbability(unit,combatValueKey)
            if runningTotal >= rand:
                # this dude dies
                casualties.append(unit)
                units.remove(unit)
                hits -= 1
                break
        # recalculate hit chance
        summedHitChance = totalDeathProbability(units, combatValueKey)

    if hits > 0:
        # if the total death probability is zero, but there's still people to kill
        # kill all remaining units. They would die anyways.
        while len(units) > 0:
            casualties.append(units.pop())
    return casualties

def unitsInTerritory(allUnits, territory):
    unitList = []
    for u in allUnits:
        if u.territory == territory:
            unitList.append(u)
    return unitList

def enemyUnits(units, country, territory):
    return [u for u in units if u.territory == territory and not alliedCountries(u.country, country)]

def getByName(items, name):
    name = str(name)
    for item in items:
        if item.name == name:
            return item
    return None

def containsUnitType(units, unitType):
    for u in units:
        if u.type is unitType:
            return True

    return False


# Checks if a unit can move through a territory to another
def canMoveThrough(unit, territory, allUnits):
    """
    Checks if type of unit can move through a territory
    :param territory: Territory
    :return: Boolean True if unit can move through, False if it cannot
    """

    if unit.isFlying():
        return True

    if territory.type == "sea":
        if unit.type == "sub":
            # can move if no destroyers present
            if not containsUnitType(territory, "destroyer"):
                return True
        if friendlySeaTerritory(territory, unit.country, allUnits):
            return True

    elif territory.type is "land":
        if alliedCountries(territory.country, unit.country):
            return True
    return False
