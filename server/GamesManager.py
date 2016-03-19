import json
import uuid

import Game
from GameBoard import BoardState

"""A class to manage games"""


class GamesManager:
    def __init__(self):
        self.games = {}

    def getGame(self, gameId):
        if gameId in self.games:
            return self.games[gameId]
        else:
            return None

    def getBoard(self, gameId):
        game = self.getGame(gameId)
        if game is None:
            return None
        else:
            return game.board

    def addGame(self, game):
        gameId = str(uuid.uuid4())
        self.games[gameId] = game
        return gameId

    def newGame(self, gameName, numPlayers, moduleName, creatorId):
        return self.addGame(Game.Game(gameName, numPlayers, moduleName, creatorId))

    def listGames(self):
        # Have this return a more lightweight representation instead, like board
        # title and ids
        return [{"id": gameId, "game": self.games[gameId]} for gameId in self.games]

    def saveGame(self, gameId):
        saveGameId = str(uuid.uuid4())
        game = self.getGame(gameId)
        with open("saveGames.json") as saveFile:
            saveGames = json.load(saveFile)

        saveGames[saveGameId] = {
            "gameInfo": BoardState.exportBoardState(game.board),
            "name": game.name,
            "maxPlayers": game.maxPlayers,
            "moduleName": game.moduleName,
            "creatorId": game.creatorId
        }

        with open("saveGames.json", "w") as saveFile:
            saveFile.write(json.dumps(saveGames))

        return saveGameId

    def loadGame(self, saveGameId):
        with open("saveGames.json") as saveFile:
            saveGames = json.load(saveFile)
            saveGameInfo = saveGames[saveGameId]

        board = BoardState.loadFromDict(saveGameInfo["gameInfo"])
        game = Game.Game(saveGameInfo["name"], saveGameInfo["maxPlayers"], saveGameInfo["moduleName"], saveGameInfo["creatorId"])
        game.board = board
        game.started = True
        return self.addGame(game)
