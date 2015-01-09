import os.path

import tornado.web
from voluptuous import Schema, Required, All, Range

from AuthHandlers import BaseAuthHandler


## Lobby Route Handlers **
class BaseLobbyHandler(BaseAuthHandler):
    def initialize(self, config, gamesManager, listingsManager):
        super(BaseLobbyHandler, self).initialize(config=config)
        self.config = config
        self.gamesManager = gamesManager
        self.listingsManager = listingsManager
        
        self.LOBBY_HTML_PATH = os.path.join(self.config.STATIC_CONTENT_PATH, "html", "lobby")

"""Serves the lobby page"""
class LobbyHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        with open(os.path.join(self.LOBBY_HTML_PATH, "lobby.html")) as f:
            self.write(f.read()) 

"""Serves a page that allows a game listing to be created"""
class LobbyCreateHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        with open(os.path.join(self.LOBBY_HTML_PATH, "lobbynew.html")) as f:
            self.write(f.read()) 

"""Serves a page that has the details of the game listing"""
class LobbyGameHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        pass

"""Serves a page that allows a game listing to be created"""
class LobbyNewHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def post(self, **params):
        pass

"""Joins a game listing"""
class LobbyGameJoinHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def post(self, **params):
        pass

"""Initiates a game from a game listing"""
class LobbyGameBeginHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        pass

"""Updates the settings of a game"""
class LobbyGameUpdateHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def post(self, **params):
        pass

"""Deletes a game listing"""
class LobbyGameDeleteHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        pass



## Lobby Objects ##
class GameListing:
    def __init__(self, boardName, numPlayers, creatorId, moduleName, password=""):
        #We are okay to have the password as a default arg, as strings are immutable
        self.boardName = boardName
        self.numPlayers = numPlayers
        self.creatorId = creatorId
        self.moduleName = moduleName
        self.password = password
        self.started = False
        
        #This could be a array of tuples if we need it to be
        self.players = {} #Contains (country, userId) pairs

    """Load the country keys into the players dict"""
    def loadCountries(self, countries):
        pass


    """Attempts to add a player to a country. Returns True on success"""
    def addPlayer(self, userId, country):
        if (self.players[country]):
            return False

        self.players[country] = userId
        return True

    def removePlayer(self, country):
        self.players[country] = None

class ListingsManager:
    def __init__(self):
        self.listings = {}
        self.lastId = 0

    def getGameListing(self, listingId):
        if listingId in self.listings:
            return self.listings[listingId]
        return None

    def addGameListing(self, listing):
        self.lastId += 1
        self.listings[self.lastId] = listing
        return self.lastId




