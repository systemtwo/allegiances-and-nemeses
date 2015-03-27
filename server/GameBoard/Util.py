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


def allied(a, b):
    """
    Returns true if a is allid to b
    :param a: Accepts a land or sea territory instance, a unit instance, or a country instance
    :param b:
    :return:
    """
    if hasattr(a, "country"):
        a = a.country
    if hasattr(b, "country"):
        b = b.country

    # doesn't have attr country, and doesn't have a team
    if not hasattr(a, "team"):
        return friendlySeaTerritory(a, b)
    elif not hasattr(b, "team"):
        return friendlySeaTerritory(b, a)

    return a.team == b.team


def friendlySeaTerritory(sea, country):
    return len(sea.enemyUnits(country)) == 0

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


# Performs a single step in a territory conflict
# Takes in a list of attackers and defenders. Removes casualties from list
def battle(attackers, defenders):
    keys = ["attack", "defence"]
    combatants = {
        "attack": attackers,
        "defence": defenders
    }
    # counts number of each side that must die
    scoredHits = {}
    for key in keys:
        scoredHits[key] = _calculateHits(combatants[key], key)

    casualties = {}
    for key in keys:
        if key == "attack":
            otherKey = "defence"
        else:
            otherKey = "attack"
        casualties[key] = _calculateCasualties(combatants[key], scoredHits[otherKey], key)

    return BattleReport(combatants, casualties)


def _calculateHits(units, combatValueKey):
    # Calculate hits. Chance for a hit is attack/6 for attackers, defence/6 for defenders
    scoredHits = 0
    for u in units:
        if random.randint(1, 6) <= u.unitInfo[combatValueKey]:
            scoredHits += 1
    return scoredHits


def totalDeathProbability(units, combatValueKey):
    total = 0
    for u in units:
        info = u.unitInfo
        if info[combatValueKey] > 0:
            total += 1.0 / info[combatValueKey]
    return total


def _calculateCasualties(units, hits, combatValueKey):
    # there's a weighted chance of each unit dying. We sum the weights for all the units
    casualties = []
    summedHitChance = totalDeathProbability(units, combatValueKey)

    # kill random peeps. chance of dying is 1/attack or 1/defence
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
            combatValue = unit.unitInfo[combatValueKey]
            if combatValue > 0:  # units with a combat value of 0 are immortal.
                runningTotal += 1.0 / combatValue
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


class BattleReport:
    def __init__(self, survivors, casualties):
        self.survivingAttackers = survivors["attack"][:]
        self.survivingDefenders = survivors["defence"][:]
        self.deadAttackers = casualties["attack"][:]
        self.deadDefenders = casualties["defence"][:]

    def toDict(self):
        return {
            "survivingAttackers": [u.toDict() for u in self.survivingAttackers],
            "survivingDefenders": [u.toDict() for u in self.survivingDefenders],
            "deadAttackers": [u.toDict() for u in self.deadAttackers],
            "deadDefenders": [u.toDict() for u in self.deadDefenders]
        }