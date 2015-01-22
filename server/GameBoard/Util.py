import json
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
    # counts number of each side that must die
    attackingCasualties = 0
    defendingCasualties = 0

    # there's a weighted chance of each unit dying. We sum the weights for all the attackers and defenders
    sumAttackers = 0
    sumDefenders = 0

    # Calculate hits. Chance for a hit is attack/6 for attackers, defence/6 for defenders
    for u in attackers:
        info = u.unitInfo
        sumAttackers += 1.0 / info.attack
        if random.randint(1, 6) <= info.attack:
            defendingCasualties += 1

    for u in defenders:
        info = u.unitInfo
        sumDefenders += 1.0 / info.defence
        if random.randint(1, 6) <= info.defence:
            attackingCasualties += 1

    # kill random peeps. chance of dying is 1/attack or 1/defence
    # using the sum of the weights, we take a random number that's less than the sum
    # Then we add up the weights of each unit until the total exceeds our random number
    # That unlucky unit is now dead
    deadA = []
    deadD = []
    while defendingCasualties > 0:
        defendingCasualties -= 1
        runningTotal = 0
        rand = random.random() * sumDefenders
        for d in defenders:
            defence = d.unitInfo.defence
            if defence > 0:
                runningTotal += 1.0 / defence
                if runningTotal >= rand:
                    deadD.append(d)
                    defenders.remove(d)
                    break

    while attackingCasualties > 0:
        attackingCasualties -= 1
        runningTotal = 0
        rand = random.random() * sumAttackers
        for a in attackers:
            attack = a.unitInfo.attack
            if attack > 0:
                runningTotal += 1.0 / attack
                if runningTotal >= rand:
                    deadA.append(a)
                    attackers.remove(a)
                    break
    return BattleReport(attackers, defenders, deadA, deadD)


class BattleReport:
    def __init__(self, attackers, defenders, deadAttack, deadDefend):
        self.survivingAttackers = attackers
        self.survivingDefenders = defenders
        self.deadAttackers = deadAttack
        self.deadDefenders = deadDefend

    def toJSON(self):
        return json.dumps({
            "survivingAttackers": self.survivingAttackers,
            "survivingDefenders": self.survivingDefenders,
            "deadAttackers": self.deadAttackers,
            "deadDefenders": self.deadDefenders
        })