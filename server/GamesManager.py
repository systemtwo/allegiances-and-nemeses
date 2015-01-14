import Game

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

    def newGame(self, gameName, numPlayers, moduleName, creatorId):
        self.lastId += 1
        self.games[self.lastId] = Game.Game(gameName, numPlayers, moduleName, creatorId)
        return self.lastId

    def listGames(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return [{"id": gameId, "game": self.games[gameId]} for gameId in self.games]
