import errno
import json
import os.path

import tornado.ioloop
import tornado.web

import GamesManager
import Sessions
import utils
from ActionHandler import ActionHandler
from AuthHandlers import LoginHandler, LogoutHandler, BaseAuthHandler
from GameBoard import BoardState
from GameConnection import GameConnection, GameSocketRouter
from GameHandler import GameHandler
from LobbyHandlers import (
    LobbyHandler,
    LobbyCreateHandler,
    LobbyGameHandler,
    LobbyGameInfoHandler,
    LobbyGameJoinHandler,
    LobbyGameBeginHandler,
    LobbyGameUpdateHandler,
    LobbyGameDeleteHandler,
)
from MapEditorHandler import MapEditorHandler
from SaveHandler import SaveHandler


class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())


class BoardsHandler(BaseAuthHandler):
    #TODO: Consider spliting this class to handle the different scenarios
    actions = utils.Enum(["NEW", "ID", "GET_FIELDS"])
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
            boardInfo = BoardState.exportBoardToClient(board)

            #See if it is the user's turn
            userSession = Sessions.SessionManager.getSession(self.current_user)
            boardInfo["isPlayerTurn"] = board.isPlayersTurn(userSession.getValue("userid"))

            self.write(json.dumps(boardInfo))

        elif self.action == self.actions.GET_FIELDS:
            requestedFields = [f.decode("utf-8") for f in self.request.arguments.get("fieldNames[]")]
            board = self.gamesManager.getBoard(int(params["boardId"]))
            response = BoardState.getFields(board, requestedFields)
            self.write(json.dumps(response))

    @tornado.web.authenticated
    def post(self, **params):
        self.set_status(405)
        self.write("Method Not Allowed")
        return


def createSaveFileIfMissing():
    # http://stackoverflow.com/a/10979569
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY

    try:
        file_handle = os.open('saveGames.json', flags)
    except OSError as e:
        if e.errno == errno.EEXIST:  # Failed as the file already exists.
            pass
        else:  # Something unexpected went wrong so reraise the exception.
            raise
    else:  # No exception, so the file must have been created successfully.
        with os.fdopen(file_handle, 'w') as file_obj:
            # Using `os.fdopen` converts the handle to an object that acts like a
            # regular Python file object, and the `with` context manager means the
            # file will be automatically closed when we're done with it.
            file_obj.write("{}")

class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")
        port = 8888
        gameSocketRouter = GameSocketRouter(GameConnection, '/gameStream')

        self.gamesManager = GamesManager.GamesManager()

        createSaveFileIfMissing()


        def saveHandlerOptions(action):
            baseOptions = dict(config=config, gamesManager=self.gamesManager, html_path=html_path)
            baseOptions["action"] = action
            return baseOptions
        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),

            #Map editor (Consider moving into a sub-list in MapEditorHandler)
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_SELECTOR, html_path=html_path)),
            (r"/mapEditor/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/mapEditor/modules/info/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_INFO, html_path=html_path)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE)),

            (r"/listImages", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.LIST_IMAGES, html_path=html_path)),

            #Board control
            #Consider renaming to /games/
            (r"/boardInfo/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID, gamesManager=self.gamesManager)), #Consider using named regex here
            (r"/getFields/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.GET_FIELDS, gamesManager=self.gamesManager)),
            (r"/boards/(?P<boardId>[0-9]+)/action/?", ActionHandler, dict(config=config, gamesManager=self.gamesManager, gameSocket=gameSocketRouter)),

            #Serve the static game page
            (r"/game/?", GameHandler, dict(config=config)),
            (r"/game/(?P<boardId>[0-9]+)/?", GameHandler, dict(config=config, gamesManager=self.gamesManager)),

            #User auth
            (r"/login/?", LoginHandler),
            (r"/logout/?", LogoutHandler),

            #Lobby web routes
            (r"/lobby/?", LobbyHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/create/?", LobbyCreateHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/?", LobbyGameHandler, dict(config=config, gamesManager=self.gamesManager)),

            #Lobby API routes
            (r"/lobby/(?P<gameId>[0-9]+)/info/?", LobbyGameInfoHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/join/?", LobbyGameJoinHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/begin/?", LobbyGameBeginHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/update/?", LobbyGameUpdateHandler, dict(config=config, gamesManager=self.gamesManager)),
            (r"/lobby/(?P<gameId>[0-9]+)/delete/?", LobbyGameDeleteHandler, dict(config=config, gamesManager=self.gamesManager)),

            #Load/Save games
            (r"/save/?", SaveHandler, saveHandlerOptions(SaveHandler.actions.SAVE)),
            (r"/load/(?P<saveGameId>[A-z0-9\-]+)/?", SaveHandler, saveHandlerOptions(SaveHandler.actions.LOAD)),
            (r"/saves/?", SaveHandler, saveHandlerOptions(SaveHandler.actions.LIST_SAVES)),
            (r"/saves/(?P<saveGameId>[A-z0-9\-]+)/delete/?", SaveHandler, saveHandlerOptions(SaveHandler.actions.DELETE)),

            #Static files
            (r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}),
            (r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}), #This is not a great way of doing this TODO: Change this to be more intuative
        ] + gameSocketRouter.urls,
        cookie_secret=config.COOKIE_SECRET,
        login_url="/login",
        debug=True
        )

        self.app.listen(port)
        print("Listening on port {}".format(port))
        self.ioloop = tornado.ioloop.IOLoop.instance()

    def start(self):
        print("Starting Server")
        self.ioloop.start()
