import Game

import uuid

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

    def newGame(self, gameName, numPlayers, moduleName, creatorId):
        gameId = str(uuid.uuid4())
        self.games[gameId] = Game.Game(gameName, numPlayers, moduleName, creatorId)
        return gameId

    def listGames(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return [{"id": gameId, "game": self.games[gameId]} for gameId in self.games]
