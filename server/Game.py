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

        self.board = GameBoard.Board(moduleName)

        #This could be a array of tuples if we need it to be
        self.players = {} #Contains (userId, [country, country, ...]) pairs

    """Attempts to add a player to the Game. Returns True on success"""
    def addPlayer(self, userId):
        if self.currPlayers >= self.maxPlayers:
            return False
        
        if userId not in self.players:
            self.players[userId] = []
            self.currPlayers += 1

        return True

    def removePlayer(self, country):
        self.currPlayers -= 1
        self.players[country] = None

    def listPlayers(self):
        return [{"id": userId, "name": str(userId)} for userId in self.players]

    def addPlayerCountry(self, userId, newCountry):
        if userId not in self.players or type(self.players[userId]) != list:
            return False

        #Make sure we don't add the country twice
        if newCountry not in self.players[userId]:
            self.players[userId].append(newCountry)

        return True

    def removePlayerCountry(self, userId, country):
        if userId not in self.players or type(self.players[userId]) == list:
            return False

        if self.players[userId].remove(country):
            return True
        else:
            return False

    def clearPlayerCountries(self, userId):
        if userId not in self.players or type(self.players[userId]) == list:
            return False

        #This clears the entire list
        del self.players[userId][:]
        return True

    def getPlayerCountries(self, userId):
        if userId not in self.players or type(self.players[userId]) == list:
            return False

        return self.players[userId]

    def getCountries(self):
        return self.board.countries

    def startGame(self):
        if self.started:
            return False

        self.started = True
        #Set up the players
        for user in self.players:
            print "Adding player", user
            self.board.addPlayer(user, self.players[user])

        return True

    def toDict(self):
        return {
            "players": self.players,
            "board": self.board
        }
