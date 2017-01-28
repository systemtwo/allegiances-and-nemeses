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
        #Consider merging playerNames with players using {userId: {countries:[], username:""}
        # Or use a class
        self.playerNames = {} #Contains userId => username pairs

    """Attempts to add a player to the Game. Returns True on success"""
    def addPlayer(self, userId, username):
        # add the player if they haven't been added yet
        if not self.containsPlayer(userId):
            if self.currentPlayerCount() >= self.maxPlayers:
                # if player hasn't been added yet, but the room is full, addPlayer fails
                return False
            self.players[userId] = []
            self.playerNames[userId] = username

        return True

    def containsPlayer(self, userId):
        return userId in self.players

    def removePlayer(self, userId):
        self.players[userId] = None
        del self.players[userId]
        self.playerNames[userId] = None
        del self.playerNames[userId]

    def listPlayers(self):
        return [
            {
                "id": userId,
                "name": self.playerNames[userId],
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
        for playerId in self.players:
            self.players[playerId] = []  # empty all country arrays
        return True

    def getPlayerCountries(self, userId):
        if userId not in self.players or type(self.players[userId]) == list:
            return False

        return self.players[userId]

    def getCountries(self):
        return self.board.playableCountries

    def startGame(self):
        if self.started:
            raise GameException("Game already started")

        for country in self.board.countries:
            if country.playable:
                isAssigned = False
                for id, countryNames in self.players.iteritems():
                    if country.name in countryNames:
                        isAssigned = True
                        break
                if not isAssigned:
                    raise GameException("Country <" + country.name + "> is not assigned to a player")

        #Set up the players
        for user in self.players:
            print("Adding player", user)
            print("Countries: ", self.players[user])
            if not self.board.addPlayer(user, self.players[user]):
                print ("Problem adding player to board", user, self.players[user])

        self.started = True
        return True

    def newBoard(self, moduleName):
        #TODO: Validate here or in the Board that the module exists
        self.board = GameBoard.BoardState.loadFromModuleName(moduleName)

    def toDict(self):
        return {
            "name": self.name,
            "players": self.listPlayers(),
            "maxPlayers": self.maxPlayers,
            "creatorId": self.creatorId,
            "moduleName": self.moduleName,
            "started": self.started,
        }
    def currentPlayerCount(self):
        return len(self.players)

class GameException(Exception):
    def __init__(self, *args, **kwargs):
        super(GameException, self).__init__(*args, **kwargs)
