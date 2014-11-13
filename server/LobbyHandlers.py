import tornado.web
from voluptuous import Schema, Required, All, Range

from AuthHandlers import BaseAuthHandler


## Lobby Route Handlers **
class BaseLobbyHandler(BaseAuthHandler):
    def initialize(self, config, boardsManager, listingsManager):
        super(BaseLobbyHandler, self).initialize(config=config)
        self.config = config
        self.boardsManager = boardsManager
        self.listingsManager = listingsManager

"""Serves the lobby page"""
class LobbyHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        self.write(str(self.path_args))
        return

"""Serves a page that allows a game listing to be created"""
class LobbyCreateHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        pass

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

class ListingsManager:
    def __init__(self):
        pass

    def getGameListing(self, listingId):
        pass



