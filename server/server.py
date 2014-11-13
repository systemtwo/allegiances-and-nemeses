import tornado.ioloop
import tornado.web

from voluptuous import Schema, Required, All, Range

import os.path
import json

import game
import utils
import BoardsManager
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

    def initialize(self, config, action, boardsManager):
        super(BoardsHandler, self).initialize(config=config)
        self.config = config
        self.action = action
        self.boardsManager = boardsManager
        
        self.setAuthenticateUser = config.USER_AUTH

    @tornado.web.authenticated
    def get(self, **params):
        if self.action == self.actions.ALL:
            #Return list of active boards
            boards = self.boardsManager.listBoards()
            self.write(json.dumps(boards))
            return

        elif self.action == self.actions.ID:
            #Return info about board with id boardId
            board = self.boardsManager.getBoard(int(params["boardId"]))

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
        if self.action == self.actions.NEW:
            #Make a new board

            #Validate settings from request
            schema = Schema({
                Required("module", default="default"): unicode,
                Required("boardName", default="Unnamed Board"): unicode,
                Required("players", default=2): All(int, Range(min=2, max=5))
            })

            request = self.request.body or "{}"
            settings = schema(json.loads(request))

            # except:
            #     self.set_status(400) #400 Bad Request
            #     return

            #Create and add the board to the working list of boards
            createdId = self.boardsManager.newBoard(settings["boardName"], settings["module"])

            #TODO: Configure map (module), number of players here
            for i in xrange(settings["players"]):
                #self.boardsManager.getBoard(createdId).addPlayer()
                pass

            #Tell the client the id of the newly created board
            # ideally, I want to get the name from the board object itself
            self.write(json.dumps({"boardId": createdId, "name": settings["boardName"]}))

        else:
            self.set_status(405)
            self.write("Method Not Allowed")
        return


class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")

        self.boardsManager = BoardsManager.BoardsManager()
        self.listingsManager = ListingsManager()

        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),

            #Map editor (Consider moving into a sub-list in MapEditorHandler)
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/modules", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULES)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_INFO)),

            #Board control
            (r"/boards/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ALL, boardsManager=self.boardsManager)),
            (r"/boards/new/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.NEW, boardsManager=self.boardsManager)),
            (r"/boards/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID, boardsManager=self.boardsManager)), #Consider using named regex here
            (r"/boards/(?P<boardId>[0-9]+)/action/?", ActionHandler, dict(config=config, boardsManager=self.boardsManager)),

            #User auth
            (r"/login/?", LoginHandler),
            (r"/logout/?", LogoutHandler),

            #Lobby web routes
            (r"/lobby", LobbyHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/create", LobbyCreateHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/?", LobbyGameHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),

            #Lobby API routes
            (r"/lobby/new", LobbyNewHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/join/?", LobbyGameJoinHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/begin/?", LobbyGameBeginHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/update/?", LobbyGameUpdateHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),
            (r"/lobby/(?P<listingId>[0-9]+)/delete/?", LobbyGameDeleteHandler, dict(config=config, boardsManager=self.boardsManager, listingsManager=self.listingsManager)),

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
