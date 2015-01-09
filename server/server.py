import tornado.ioloop
import tornado.web

from voluptuous import Schema, Required, All, Range

import os.path
import json

import utils
import BoardsManager
import GamesManager
from MapEditorHandler import MapEditorHandler
from ActionHandler import ActionHandler
from AuthHandlers import LoginHandler, LogoutHandler, BaseAuthHandler
from LobbyHandlers import LobbyHandler, LobbyCreateHandler, LobbyGameHandler, LobbyNewHandler, LobbyGameJoinHandler, LobbyGameBeginHandler, LobbyGameUpdateHandler, LobbyGameDeleteHandler, ListingsManager



class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())


class BoardsHandler(BaseAuthHandler):
    #TODO: Consider spliting this class to handle the different scenarios
    actions = utils.Enum(["ALL", "NEW", "ID"])
    nextBoardId = 0

    def initialize(self, config, action, gamesManager):
        super(BoardsHandler, self).initialize(config=config)
        self.config = config
        self.action = action
        self.gamesManager = gamesManager
        
        self.setAuthenticateUser = config.USER_AUTH

    @tornado.web.authenticated
    def get(self, **params):
        if self.action == self.actions.ALL:
            #Return list of active boards
            boards = self.gamesManager.listGames()
            self.write(json.dumps(boards))
            return

        elif self.action == self.actions.ID:
            #Return info about board with id boardId
            board = self.gamesManager.getBoard(int(params["boardId"]))

            if not board:
                self.set_status(404)
                self.write("Board not found")
                return

            # Return the board info as json
            boardInfo = board.toDict()
            boardInfo["imagePath"] = os.path.join(self.config.MODS_PATH, boardInfo["moduleName"], boardInfo["imageName"])
            self.write(json.dumps(boardInfo))

    @tornado.web.authenticated
    def post(self, **params):
        self.set_status(405)
        self.write("Method Not Allowed")
        return


class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")

        self.gamesManager = GamesManager.GamesManager()
        self.listingsManager = ListingsManager()

        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),

            #Map editor (Consider moving into a sub-list in MapEditorHandler)
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/modules", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULES)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_INFO)),

            #Board control
            #Consider renaming to /games/
            (r"/boards/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ALL, gamesManager=self.gamesManager)),
            (r"/boards/new/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.NEW, gamesManager=self.gamesManager)),
            (r"/boards/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID, gamesManager=self.gamesManager)), #Consider using named regex here
            (r"/boards/(?P<boardId>[0-9]+)/action/?", ActionHandler, dict(config=config, gamesManager=self.gamesManager)),

            #User auth
            (r"/login/?", LoginHandler),
            (r"/logout/?", LogoutHandler),

            #Lobby web routes
            (r"/lobby/?", LobbyHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/create/?", LobbyCreateHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/?", LobbyGameHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),

            #Lobby API routes
            (r"/lobby/new/?", LobbyNewHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/join/?", LobbyGameJoinHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/begin/?", LobbyGameBeginHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/update/?", LobbyGameUpdateHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/delete/?", LobbyGameDeleteHandler, dict(config=config, gamesManager=self.gamesManager, listingsManager=self.listingsManager)),

			#Static files
            (r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}),
            (r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}), #This is not a great way of doing this TODO: Change this to be more intuative
        ], 
        cookie_secret=config.COOKIE_SECRET,
        login_url="/login",
        debug=True
        )

        self.app.listen(8888)
        self.ioloop = tornado.ioloop.IOLoop.instance()

    def start(self):
        print("Starting Server")
        self.ioloop.start()
