import tornado.ioloop
import tornado.web

from voluptuous import Schema, Required, All, Range, MultipleInvalid

import os.path
import json

import utils
import GamesManager
from MapEditorHandler import MapEditorHandler
from ActionHandler import ActionHandler
from AuthHandlers import LoginHandler, LogoutHandler, BaseAuthHandler
from LobbyHandlers import LobbyHandler, LobbyCreateHandler, LobbyGameHandler, LobbyGameJoinHandler, LobbyGameBeginHandler, LobbyGameUpdateHandler, LobbyGameDeleteHandler
from GameHandler import GameHandler



class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())


class BoardsHandler(BaseAuthHandler):
    #TODO: Consider spliting this class to handle the different scenarios
    actions = utils.Enum(["NEW", "ID", "CONFLICTS"])
    nextBoardId = 0

    def initialize(self, config, action, gamesManager):
        super(BoardsHandler, self).initialize(config=config)
        self.config = config
        self.action = action
        self.gamesManager = gamesManager

        self.setAuthenticateUser = config.USER_AUTH

    @tornado.web.authenticated
    def get(self, **params):
        if self.action == self.actions.ID:
            #Return info about board with id boardId
            game = self.gamesManager.getGame(int(params["boardId"]))
            if not game:
                self.set_status(404)
                self.write("Board not found")
                return

            board = game.board

            # Return the board info as json
            boardInfo = board.toDict()
            boardInfo["imagePath"] = os.path.join(self.config.MODS_PATH, boardInfo["moduleName"], boardInfo["imageName"])
            self.write(json.dumps(boardInfo))

        elif self.action == self.actions.CONFLICTS:
            conflicts = self.gamesManager.getConflicts(int(params["boardId"]))
            if conflicts is None:
                self.set_status(400)
                return

            self.write(json.dumps(conflicts))

    @tornado.web.authenticated
    def post(self, **params):
        self.set_status(405)
        self.write("Method Not Allowed")
        return


class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")

        self.gamesManager = GamesManager.GamesManager()

        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),

            #Map editor (Consider moving into a sub-list in MapEditorHandler)
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_SELECTOR, html_path=html_path)),
            (r"/mapEditor/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE)),

            #Board control
            #Consider renaming to /games/
            (r"/boardInfo/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID, gamesManager=self.gamesManager)), #Consider using named regex here
            (r"/conflicts/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.CONFLICTS, gamesManager=self.gamesManager)),
            (r"/boards/(?P<boardId>[0-9]+)/action/?", ActionHandler, dict(config=config, gamesManager=self.gamesManager)),

            #Serve the static game page
            (r"/game/?", GameHandler, dict(config=config)),
            (r"/game/(?P<boardId>[0-9]+)/?", GameHandler, dict(config=config)),

            #User auth
            (r"/login/?", LoginHandler),
            (r"/logout/?", LogoutHandler),

            #Lobby web routes
            (r"/lobby/?", LobbyHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/create/?", LobbyCreateHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/?", LobbyGameHandler, dict(config=config, gamesManager=self.gamesManager)),

            #Lobby API routes
            (r"/lobby/(?P<gameId>[0-9]+)/join/?", LobbyGameJoinHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/begin/?", LobbyGameBeginHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/update/?", LobbyGameUpdateHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/delete/?", LobbyGameDeleteHandler, dict(config=config, gamesManager=self.gamesManager)),

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
