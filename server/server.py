import tornado.ioloop
import tornado.web

import os.path
import json

import game
from MapEditorHandler import MapEditorHandler
import utils


import random
import BoardCollection
from ActionHandler import ActionHandler


class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())



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

    def initialize(self, config, action):
        self.config = config
        self.action = action

    def get(self, **params):
        if self.action == self.actions.ALL:
            #Return list of active boards
            self.write(json.dumps(BoardCollection.getBoards()))
        elif self.action == self.actions.NEW:
            #Make a new board

            #Grab settings from request
            #settings = json.loads(self.request.body)

            #TODO: Configure map (module), number of players here

            #Create and add the board to the working list of boards
            newBoard = game.Board("Default name plz update code", "default")
            # newBoard = game.Board(self.get_argument("name"), self.get_argument("module"))
            BoardCollection.addBoard(newBoard)
            #Tell the client the id of the newly created board
            self.write(json.dumps({"boardId": newBoard.id.hex}))
        elif self.action == self.actions.ID:
            #Return info about board with id boardId

            board = BoardCollection.getBoard(params["boardId"])
            if not board:
                self.set_status(404)
                self.write("Board not found")
                return

            # Return the board info as json
            boardInfo = board.toDict()
            boardInfo["imagePath"] = os.path.join(self.config.MODS_PATH, boardInfo["moduleName"], boardInfo["imageName"])
            self.write(json.dumps(boardInfo))

    def post(self, **params):
        if self.action == self.actions.ID:
            if BoardCollection.getBoard(params["boardId"]): #Make sure this is a valid board
                #Make sure there is a body
                if len(req.body) == 0:
                    self.set_status(400)
                    return

                #Make sure there is a valid body
                try:
                    json.loads(req.body)
                except ValueError:
                    self.set_status(400)
                    return

                req = json.loads(req.body)

        else:
            self.set_status(405)
            self.write("Method Not Allowed")
        return




class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")
        self.app = tornado.web.Application([
            (r"/", IndexHandler, dict(html_path=html_path)),

            #Map editor (Consider moving into a sub-list in MapEditorHandler)
            (r"/mapEditor", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.PAGE, html_path=html_path)),
            (r"/modules", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULES)),
            (r"/modules/create/?", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.CREATE)),
            (r"/modules/(?P<moduleName>[A-z]+)", MapEditorHandler, dict(config=config, action=MapEditorHandler.actions.MODULE_INFO)),

            #Board control
            (r"/boards/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ALL)),
            (r"/boards/new/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.NEW)),
            (r"/boards/(?P<boardId>[0-9A-z]+)/?", BoardsHandler, dict(config=config, action=BoardsHandler.actions.ID)), #Consider using named regex here
            (r"/boards/(?P<boardId>[0-9A-z]+)/action/?", ActionHandler),

            #Static files
            (r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}),
            (r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}), #This is not a great way of doing this TODO: Change this to be more intuative
        ], debug=True)

        self.app.listen(8888)
        self.ioloop = tornado.ioloop.IOLoop.instance()

    def start(self):
        print("Starting Server")
        self.ioloop.start()

