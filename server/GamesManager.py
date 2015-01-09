import GameBoard

"""A class to manage games"""
class GamesManager:
    def __init__(self):
        self.games = {}
        self.lastId = 0
    
    def getGame(self, boardId):
        if boardId in self.boards:
            return self.boards[boardId]
        else:
            return None

    def newGame(self, boardName, module):
        self.lastId += 1
        self.boards[self.lastId] = GameBoard.Board(boardName, module)
        return self.lastId

    def listGames(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return [{"id": gameId, "name": self.games[gameId].name} for gameId in self.games]
