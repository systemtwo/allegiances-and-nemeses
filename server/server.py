import io
import tornado.ioloop
import tornado.web

import os.path
import json

import utils
import game


import random




class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())


class MapEditorHandler(tornado.web.RequestHandler):
    actions = utils.Enum(["PAGE", "MODULES", "MODULE_INFO", "CREATE"])

    def initialize(self, action, config, html_path=""):
        self.HTML_PATH = html_path
        self.action = action
        self.config = config

    def get(self, **params):
        if self.action == self.actions.PAGE:
            # surely there's a better way of handling this
            with open(os.path.join(self.HTML_PATH, "mapEditor.html")) as f:
                self.write(f.read())
        elif self.action == self.actions.MODULES:
            moduleNames = os.listdir(self.config.MODS_PATH)
            self.write(json.dumps(moduleNames))
        elif self.action == self.actions.MODULE_INFO:
            returnObject = {}
            moduleName = params["moduleName"]
            with open(game.Util.countryFileName(moduleName)) as countryInfo:
                returnObject["countries"] = countryInfo.read()

            with open(game.Util.unitFileName(moduleName)) as unitInfo:
                returnObject["units"] = unitInfo.read()

            with open(game.Util.territoryFileName(moduleName)) as territoryInfo:
                returnObject["territories"] = territoryInfo.read()

            with open(game.Util.connectionFileName(moduleName)) as connections:
                returnObject["connections"] = connections.read()

            with open(game.Util.filePath(moduleName, "info.json")) as file:
                info = json.load(file)
                returnObject["wrapsHorizontally"] = info["wrapsHorizontally"]
                if "imageName" in info:
                    returnObject["imagePath"] = os.path.join(self.config.MODS_PATH, moduleName, info["imageName"])
                else:
                    returnObject["imagePath"] = self.config.DEFAULT_IMAGE_PATH  # convert to config var when convenient

            self.write(json.dumps(returnObject))
        elif self.action == self.actions.CREATE:
            moduleName = self.get_argument("moduleName")
            if not os.path.exists(os.path.join(self.config.MODS_PATH, moduleName)):
                os.makedirs(os.path.join(self.config.MODS_PATH, moduleName))
                with open(game.Util.countryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(game.Util.unitFileName(moduleName), 'w') as f:
                    f.write("{}")
                with open(game.Util.territoryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(game.Util.connectionFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(game.Util.filePath(moduleName, "info.json"), "w") as file:
                    file.write(json.dumps({
                        "wrapsHorizontally": False
                    }))

class BoardHandler(tornado.web.RequestHandler):
    def initialize(self):
        pass

    def get(self):
        pass

    def post(self):
        pass


class BoardsHandler(tornado.web.RequestHandler):
    #TODO: Consider spliting this class to handle the different scenarios
    actions = utils.Enum(["ALL", "NEW", "ID"])
    # boards = []
    boards = [game.Board("default"), game.Board("uw")]

    def initialize(self, config, action):
        self.config = config
        self.action = action

    def get(self, **params):
        if self.action == self.actions.ALL:
            #Return list of active boards
            self.write("All")
        elif self.action == self.actions.NEW:
            #Make a new board
            newBoard = game.Board("default")
            print(newBoard.id)
            self.boards.append(newBoard)
            # self.redirect(r"/boards/" + str(random.randint(0, 100)))
        elif self.action == self.actions.ID:
            #Return info about board with id boardId
            board = self.getBoard(params["boardId"])
            # Return the board info as json
            boardInfo = board.toDict()
            boardInfo["imagePath"] = os.path.join(self.config.MODS_PATH, boardInfo["moduleName"], boardInfo["imageName"])
            self.write(json.dumps(boardInfo))

    def post(self, **params):
        if self.action == self.actions.ID:
            req = self.request
            self.write("boardid:" + str(params["boardId"]))
            self.write(str(req.body))
        else:
            self.set_status(405)
            self.write("Method Not Allowed")
        return

    def getBoard(self, boardId):
        for b in self.boards:
            print("id " + b.id)
            print(boardId)
            if b.id == boardId:
                return b




class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")
        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/modules", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULES)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_INFO)),
            (r"/boards/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ALL)),
            (r"/boards/new/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.NEW)),
            (r"/boards/(?P<boardId>[0-9]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID)), #Consider using named regex here
            (r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}),
            (r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}), #This is not a great way of doing this TODO: Change this to be more intuative
        ], debug=True)

        self.app.listen(8888)
        self.ioloop = tornado.ioloop.IOLoop.instance()

    def start(self):
        print("Starting Server")
        self.ioloop.start()

