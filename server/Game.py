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
        self.players = {} #Contains (userId, [country, country, ...]) pairs
        self.countries = []

        #Currently a mock method
        self.loadCountries([])

    """Attempts to add a player to the Game. Returns True on success"""
    def addPlayer(self, userId):
        if (self.currPlayers >= self.maxPlayers):
            return False
        
        if (userId not in self.players):
            self.players[userId] = []

        self.currPlayers += 1
        return True

    def removePlayer(self, country):
        self.currPlayers -= 1
        self.players[country] = None

    def listPlayers(self):
        return [userId for userId in self.players]

    def addPlayerCountry(self, userId, newCountry):
        if (userId not in self.players or type(self.players[userId]) == list):
            return False

        self.players[userId].append(newCountry)
        return True

    def removePlayerCountry(self, userId, country):
        if (userId not in self.players or type(self.players[userId]) == list):
            return False

        if (self.players[userId].remove(country)):
            return True
        else:
            return False

    def removePlayerCountries(self, userId):
        if (userId not in self.players or type(self.players[userId]) == list):
            return False

        #This clears the entire list
        del self.players[userId][:]
        return True


    def getPlayerCountries(self, userId):
        if (userId not in self.players or type(self.players[userId]) == list):
            return False

        return self.players[userId]

        





    def loadCountries(self, countries):
        #Mock method 
        self.countries = ["Canada", "USA"]
        pass

