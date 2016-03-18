import json

import Util
import Conflict
from .Country import Country
from .Territory import LandTerritory, SeaTerritory
import Unit
from .Unit import UnitInfo
from .Board import Board

# This file handles exporting game state, and creating a game state from a snapshot or module definition

_sharedFields = [
    "countries",
    "territories",
    "units",
    "buyList",
    "currentPhase",
    "currentCountry",
    "winningTeam",

    # Module info
    "unitCatalogue"
]
# Exporters
def exportBoardToClient(board):
    clientFields = _sharedFields[:]
    clientFields.append("conflicts")
    return getFields(board, clientFields)


# needed to export/import board state for save games, debugging, etc
def exportBoardState(board):
    clientFields = _sharedFields[:]
    clientFields.append("pastConflicts")
    return getFields(board, clientFields)


def getFields(board, fieldNames):
    fieldValues = {}
    for field in fieldNames:
        fieldValues[field] = _getField(board, field)
    return fieldValues


def _getField(board, fieldName):
    if fieldName == "countries":
        return [c.toDict() for c in board.countries]
    elif fieldName == "units":
        return [u.toDict() for u in board.units]
    elif fieldName == "territories":
        return [t.toDict() for t in board.territories]
    elif fieldName == "buyList":
        return [bought.toDict() for bought in board.buyList]

    elif fieldName == "currentPhase":
        return board.currentPhase.name
    elif fieldName == "currentCountry":
        return board.currentCountry.name

    elif fieldName == "unitCatalogue":
        return {
            unitType: info.toDict() for unitType, info in board.unitInfoDict.iteritems()
            }
    elif fieldName == "winningTeam":
        return board.winningTeam

    # for client export
    elif fieldName == "conflicts":
        # current and past conflicts in reverse chronological order
        return [c.toDict() for c in board.computeConflicts() + list(reversed(board.resolvedConflicts))]
    # For full state export only
    elif fieldName == "pastConflicts":
        # current and past conflicts in reverse chronological order
        return [c.toDict() for c in board.resolvedConflicts]

    else:
        raise Exception("Unsupported field: " + fieldName)


# Importers

def createTerritory(info, countries):
    if info["type"] == "land":
        startingCountry = _getOriginalOwner(countries, info)
        return LandTerritory(info["name"], info["displayName"], info["income"], startingCountry, info["displayInfo"])
    elif info["type"] == "sea":
        return SeaTerritory(info["name"], info["displayName"], info["displayInfo"])
    else:
        raise Exception("Territory info does not have valid type")


def createCountry(info):
    country = Country(info["name"], info["displayName"], info["team"], info["color"], info["selectableColor"], info["playable"])
    if "player" in info:
        country.setPlayer(info["player"])
    return country


def loadFromDict(fields):
    countries = [createCountry(countryInfo) for countryInfo in fields["countries"]]
    territories = [createTerritory(tInfo, countries) for tInfo in fields["territories"]]

    for info in fields["territories"]:
        territory = Util.getByName(territories, info["name"])
        territory.connections = [Util.getByName(territories, neighbour) for neighbour in info["connections"]]

    unitInfo = {unitType: UnitInfo(unitType, unitInfo) for unitType, unitInfo in fields["unitCatalogue"].items()}

    units = []
    for unitDef in fields["units"]:
        newUnit = Unit.createUnitFromDict(unitDef, unitInfo, countries, territories)
        units.append(newUnit)

    board = Board(unitInfo, territories, units, countries, fields["currentPhase"])
    for conflictInfo in fields["pastConflicts"]:
        conflict = Conflict.fromDict(conflictInfo, board)


        board.resolvedConflicts.append(conflict)
    board.currentCountry = Util.getByName(countries, fields["currentCountry"])
    return board


def loadFromModuleName(moduleName):
    # load json from module
    with open(Util.countryFileName(moduleName)) as countryInfo:
        countries = [createCountry(cInfo) for cInfo in json.load(countryInfo)]

    with open(Util.unitFileName(moduleName)) as unitInfo:
        unitCatalogue = json.load(unitInfo)
        unitInfoDict = {unitType: UnitInfo(unitType, jsonInfo) for unitType, jsonInfo in
                        unitCatalogue.items()}

    with open(Util.territoryFileName(moduleName)) as territoryInfo:
        territoryInfo = json.load(territoryInfo)

    territories = [createTerritory(info, countries) for info in territoryInfo]

    with open(Util.connectionFileName(moduleName)) as connections:
        connections = json.load(connections)
        for c in connections:
            first = None
            second = None
            for t in territories:
                if t.name == c[0]:
                    first = t
                elif t.name == c[1]:
                    second = t
            if first and second:
                first.connections.append(second)
                second.connections.append(first)
            else:
                raise Exception("Could not find territories for connection: " + json.dumps(c))

    units = []
    # add units
    with open(Util.filePath(moduleName, "unitSetup.json")) as unitFile:
        unitSetup = json.load(unitFile)
        for tName, unitTypes in unitSetup.items():
            territory = Util.getByName(territories, tName)
            assert territory is not None, "Invalid territory name %r" % tName
            for unitType in unitTypes:
                units.append(Unit.Unit(unitInfoDict[unitType], territory.country, territory))

    return Board(unitInfoDict, territories, units, countries)


def _getOriginalOwner(countries, terInfo):
    if "country" not in terInfo:
        print("No country set for territory\n")
        print(terInfo)
        return
    for c in countries:
        if c.name == terInfo["country"]:
            return c
