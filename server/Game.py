import GameBoard

class Game:
    def __init__(self, gameName, numPlayers, moduleName, creatorId, password=""):
        #We are okay to have the password as a default arg, as strings are immutable
        self.name = gameName
        self.maxPlayers = numPlayers
        self.creatorId = creatorId
        self.moduleName = moduleName
        self.password = password
        self.started = False

        self.board = GameBoard.BoardState.loadFromModuleName(moduleName)

        #This could be a array of tuples if we need it to be
        self.players = {} #Contains (userId, [country, country, ...]) pairs

    """Attempts to add a player to the Game. Returns True on success"""
    def addPlayer(self, userId):
        # add the player if they haven't been added yet
        if not self.containsPlayer(userId):
            if self.currentPlayerCount() >= self.maxPlayers:
                # if player hasn't been added yet, but the room is full, addPlayer fails
                return False
            self.players[userId] = []

        return True

    def containsPlayer(self, userId):
        return userId in self.players

    def removePlayer(self, userId):
        self.players[userId] = None

    def listPlayers(self):
        return [
            {
                "id": userId,
                "name": str(userId),
                "assignedCountries": countries
            } for userId, countries in self.players.iteritems()
        ]

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

    def clearAllPlayerCountries(self):
        self.players.clear()
        return True

    def getPlayerCountries(self, userId):
        if userId not in self.players or type(self.players[userId]) == list:
            return False

        return self.players[userId]

    def getCountries(self):
        return self.board.playableCountries

    def startGame(self):
        if self.started:
            return False

        self.started = True
        #Set up the players
        for user in self.players:
            print("Adding player", user)
            print("Countries: ", self.players[user])
            if not self.board.addPlayer(user, self.players[user]):
                print ("Problem adding player to board", user, self.players[user])

        return True

    def newBoard(self, moduleName):
        #TODO: Validate here or in the Board that the module exists
        self.board = GameBoard.BoardState.loadFromModuleName(moduleName)

    def toDict(self):
        return {
            "players": self.players,
            "board": self.board
        }

    def currentPlayerCount(self):
        return len(self.players)