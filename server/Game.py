import GameBoard

class Game:
    def __init__(self, gameName, numPlayers, moduleName, password=""):
        #We are okay to have the password as a default arg, as strings are immutable
        self.name = gameName
        self.numPlayers = numPlayers
        self.creatorId = creatorId
        self.moduleName = moduleName
        self.password = password
        self.started = False


        
        self.board = GameBoard.Board(moduleName)

        #This could be a array of tuples if we need it to be
        self.players = {} #Contains (country, userId) pairs

    """Attempts to add a player to a country. Returns True on success"""
    def addPlayer(self, userId, country):
        if (self.players[country]):
            return False

        self.players[country] = userId
        return True

    def removePlayer(self, country):
        self.players[country] = None

    def listPlayers(self):
        pass
