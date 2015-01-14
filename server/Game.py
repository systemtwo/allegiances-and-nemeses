import GameBoard

class Game:
    def __init__(self, gameName, numPlayers, moduleName, creatorId, password=""):
        #We are okay to have the password as a default arg, as strings are immutable
        self.name = gameName
        self.currPlayers = 0
        self.maxPlayers = numPlayers
        self.creatorId = creatorId
        self.moduleName = moduleName
        self.password = password
        self.started = False


        
        #self.board = GameBoard.Board(moduleName)

        #This could be a array of tuples if we need it to be
        self.players = {} #Contains (country, userId) pairs

    """Attempts to add a player to a country. Returns True on success"""
    def addPlayer(self, userId, country):
        if (self.currPlayers > self.maxPlayers):
            return False
        

        if (country not in self.players):
            self.players[country] = None

        if (self.players[country]):
            return False

        self.players[country] = userId
        self.currPlayers += 1
        return True

    def removePlayer(self, country):
        self.currPlayers -= 1
        self.players[country] = None

    def listPlayers(self):
        pass

    def loadCountries(self, countries):
        pass

