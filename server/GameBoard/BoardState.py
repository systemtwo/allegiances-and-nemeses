import Util
from .Country import Country
from .Territory import LandTerritory, SeaTerritory
from .Unit import Unit, UnitInfo
from .Board import Board

import json

# This file handles exporting game state, and creating a game state from a snapshot or module definition

# Exporters
def exportBoardToClient(board):
    allFields = [
        "countries",
        "territories",
        "units",
        "buyList",
        "conflicts",
        "currentPhase",
        "currentCountry",
        "winningTeam",

        # Module info
        "unitCatalogue"
    ]
    return getFields(board, allFields)

# needed to export/import board state for save games, debugging, etc
def exportBoardState(board):
    pass


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
    elif fieldName == "buyList":
        return [bought.toDict() for bought in board.buyList]
    elif fieldName == "conflicts":
        # current and past conflicts in reverse chronological order
        return [c.toDict() for c in board.computeConflicts() + list(reversed(board.resolvedConflicts))]

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

    # For full state export
    elif fieldName == "territories":
        return [t.toDict() for t in board.territories]
    elif fieldName == "fullCurrentPhase":
        return board.currentPhase.toDict()  # TODO implement for each phase
    elif fieldName == "pastConflicts":
        # current and past conflicts in reverse chronological order
        return [c.toDict() for c in board.resolvedConflicts]

    else:
        raise Exception("Unsupported field: " + fieldName)


# Importers
def loadFromDict(fields):
    pass


def loadFromModuleName(moduleName):
    # load json from module
    with open(Util.countryFileName(moduleName)) as countryInfo:
        countries = [
            Country(c["name"], c["displayName"], c["team"], c["color"], c["selectableColor"], c["playable"]) for c
            in
            json.load(countryInfo)]

    with open(Util.unitFileName(moduleName)) as unitInfo:
        unitCatalogue = json.load(unitInfo)
        unitInfoDict = {unitType: UnitInfo(unitType, jsonInfo) for unitType, jsonInfo in
                        unitCatalogue.items()}

    with open(Util.territoryFileName(moduleName)) as territoryInfo:
        territoryInfo = json.load(territoryInfo)

    territories = []
    for info in territoryInfo:
        if info["type"] == "land":
            startingCountry = _getOriginalOwner(countries, info)
            territories.append(
                LandTerritory(info["name"], info["displayName"], info["income"], startingCountry, info["displayInfo"]))
        elif info["type"] == "sea":
            territories.append(SeaTerritory(info["name"], info["displayName"], info["displayInfo"]))
        else:
            print("Territory info does not have valid type")
            print(info)

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
                units.append(Unit(unitInfoDict[unitType], territory.country, territory))

    return Board([], unitInfoDict, territories, units, countries)


def _getOriginalOwner(countries, terInfo):
    if "country" not in terInfo:
        print("No country set for territory\n")
        print(terInfo)
        return
    for c in countries:
        if c.name == terInfo["country"]:
            return c