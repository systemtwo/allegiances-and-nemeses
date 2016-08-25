import json
import uuid

import Game
import utils
from GameBoard import BoardState

"""A class to manage games"""


class GamesManager:
    def __init__(self):
        self.games = {}
        self.lastId = 0

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
        self.lastId += 1
        self.games[self.lastId] = game
        return self.lastId

    def newGame(self, gameName, numPlayers, moduleName, creatorId):
        return self.addGame(Game.Game(gameName, numPlayers, moduleName, creatorId))

    def listGames(self):
        # Have this return a more lightweight representation instead, like board
        # title and ids
        listings = []
        for gameId, game in self.games.iteritems():
            listings.append({
                "id": gameId,
                "name": game.name,
                "currentPlayerCount": game.currentPlayerCount(),
                "maxPlayers": game.maxPlayers
            })
        return listings

    def saveGame(self, gameId, name):
        saveGameId = str(uuid.uuid4())
        game = self.getGame(gameId)
        with open("saveGames.json") as saveFile:
            saveGames = json.load(saveFile)

        saveGames[saveGameId] = {
            "id": saveGameId,
            "gameInfo": BoardState.exportBoardState(game.board),
            "name": name,
            "gameName": game.name,
            "maxPlayers": game.maxPlayers,
            "moduleName": game.moduleName,
            "creatorId": game.creatorId
        }

        with open("saveGames.json", "w") as saveFile:
            saveFile.write(json.dumps(saveGames))

        return saveGameId

    def loadGame(self, saveGameId):
        saveGames = utils.getSaveGames()
        saveGameInfo = saveGames[saveGameId]

        board = BoardState.loadFromDict(saveGameInfo["gameInfo"])
        game = Game.Game(saveGameInfo["name"], saveGameInfo["maxPlayers"], saveGameInfo["moduleName"], saveGameInfo["creatorId"])
        game.board = board
        game.started = True
        return self.addGame(game)

    def deleteGame(self, gameId):
        if gameId in self.games:
            del self.games[gameId]
            return True
        return False