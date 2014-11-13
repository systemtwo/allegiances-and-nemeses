import tornado.ioloop
import tornado.web

from voluptuous import Schema, Required, All, Range

import os.path
import json

import game
from MapEditorHandler import MapEditorHandler
import utils


import random




class IndexHandler(tornado.web.RequestHandler):
    def initialize(self, html_path):
        self.HTML_PATH = html_path

    def get(self):
        with open(os.path.join(self.HTML_PATH, "index.html")) as f:
            self.write(f.read())


"""A class to manage game boards"""
class BoardsManager():
    def __init__(self):
        self.boards = {}
        self.lastId = 0
    
    def getBoard(self, boardId):
        if boardId in self.boards:
            return self.boards[boardId]
        else:
            return None

    def newBoard(self, module):
        self.lastId += 1
        self.boards[self.lastId] = game.Board(module)
        return self.lastId

    def listBoards(self):
        #Have this return a more lightweight representation instead, like board 
        #title and ids
        return self.boards

    



class BoardsHandler(tornado.web.RequestHandler):
    #TODO: Consider spliting this class to handle the different scenarios
    actions = utils.Enum(["ALL", "NEW", "ID"])
    nextBoardId = 0

    def initialize(self, config, action, boardsManager):
        self.config = config
        self.action = action
        self.boardsManager = boardsManager

    def get(self, **params):
        if self.action == self.actions.ALL:
            #Return list of active boards
            boards = self.boardsManager.listBoards()
            boardsList = []

            for boardId in boards:
                boardsList.append(boardId)

            self.write(json.dumps(boardsList))
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


    def post(self, **params):
        #TODO: Add validation with voluptuous here!
        if self.action == self.actions.ID:
            if self.boardsManager.getBoard(int(params["boardId"])): #Make sure this is a valid board
                try:
                    schema = Schema({
                        Required("action"): unicode
                    })

                    
                    schema(json.loads(self.request.body))

                except:
                    self.set_status(400) #400 Bad Request
                    return


                print req

				
        elif self.action == self.actions.NEW:
            #Make a new board

            #Validate settings from request
            try:
                schema = Schema({
                    Required("module", default="default"): unicode,
                    Required("players", default=2): All(int, Range(min=2, max=5))
                })

                print json.loads(self.request.body)
                settings = schema(json.loads(self.request.body))

            except:
                self.set_status(400) #400 Bad Request
                return

            
			

            #Create and add the board to the working list of boards
            createdId = self.boardsManager.newBoard(settings["module"])

            #TODO: Configure map (module), number of players here
            for i in xrange(settings["players"]):
                self.boardsManager.getBoard(createdId).addPlayer()

			
            #Tell the client the id of the newly created board
            self.write(json.dumps({"boardId": createdId}))

        else:
            self.set_status(405)
            self.write("Method Not Allowed")
        return


    """Checks to see if a move request body is valid"""
    def validMoveRequest(self, body):
        #We check to see if the body is validJSON
        if len(req.body) == 0:
            return False

        try:
            json.loads(body)
        except ValueError:
            return False

        return True



    """Get the board with a specific id"""
    def getBoard(self, boardId):
        #We use ints for the id, so we force the boardId to be an int
        normalizedBoardId = int(boardId)
        if normalizedBoardId in BoardsHandler.boards:
            return BoardsHandler.boards[normalizedBoardId]
        return None




class Server:
    def __init__(self, config):
        html_path = os.path.join(config.STATIC_CONTENT_PATH, "html")

        self.boardsManager = BoardsManager()

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

			#Static files
            (r"/shared/(.*)", utils.NoCacheStaticFileHandler, {"path": config.SHARED_CONTENT_PATH}),
            (r"/static/(.*)", utils.NoCacheStaticFileHandler, {"path": config.STATIC_CONTENT_PATH}), #This is not a great way of doing this TODO: Change this to be more intuative
        ], debug=True)

        self.app.listen(8888)
        self.ioloop = tornado.ioloop.IOLoop.instance()

    def start(self):
        print("Starting Server")
        self.ioloop.start()

