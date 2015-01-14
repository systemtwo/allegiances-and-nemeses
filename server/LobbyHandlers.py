import os.path

import tornado.web
from voluptuous import Schema, Required, All, Range, Length, MultipleInvalid

from AuthHandlers import BaseAuthHandler


## Lobby Route Handlers **
class BaseLobbyHandler(BaseAuthHandler):
    def initialize(self, config, gamesManager):
        super(BaseLobbyHandler, self).initialize(config=config)
        self.config = config
        self.gamesManager = gamesManager
        
        self.LOBBY_HTML_PATH = os.path.join(self.config.STATIC_CONTENT_PATH, "html", "lobby")

"""Serves the lobby page"""
class LobbyHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        renderArguments = {}
        renderArguments["listings"] = self.gamesManager.listGames()
        
        self.render(os.path.join("..", self.LOBBY_HTML_PATH, "lobby.html"), **renderArguments)


        #with open(os.path.join(self.LOBBY_HTML_PATH, "lobbynew.html")) as f:
        #Consider doing t = tornado.Template(file.read())
        #self.write(t.generate(params))

"""Serves a page that allows a game listing to be created"""
class LobbyCreateHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        renderArguments = {}
        renderArguments["modules"] = [{"name": "default"}]
        self.render(os.path.join("..", self.LOBBY_HTML_PATH, "lobbynew.html"), **renderArguments)
        print "rendered"

    @tornado.web.authenticated
    def post(self, **params):
        userInput = {}
        userInput['roomName'] = self.get_argument("roomname")
        #FIXME: Unsafe cast!
        userInput['players'] = int(self.get_argument("players"))
        userInput['module'] = self.get_argument("module")

        schema = Schema({
            Required("roomName"): All(unicode, Length(min=1)),
            Required("players"): All(int, Range(min=1, max=5)),
            Required("module"): unicode
        })

        try:
            validUserInput = schema(userInput)
        except MultipleInvalid as e:
            print str(e)
            self.send_error(400)
            return


        #TODO: Check for validity of module
        #ie. Does it exist?


        self.gamesManager.newGame(validUserInput["roomName"], validUserInput["players"], validUserInput["module"], self.current_user)
        self.redirect("/lobby")
        return

"""Serves a page that has the details of the game listing"""
class LobbyGameHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        renderArguments = {}
        renderArguments['players'] = ['a', 'b']
        renderArguments['countries'] = [{"id": 0, "name": "A"}, {"id": 1, "name": "B"}]
        self.render(os.path.join("..", self.LOBBY_HTML_PATH, "lobbyjoining.html"), **renderArguments)

    # Change the game settings, eg. Player <-> Country mapping
    def post(self, **params):
        userInput = {}

        #TODO: Validate the game id
        #FIXME? We hackishly cast here...
        userInput['gameId'] = int(params["gameId"])
        #userInput['countryId'] = self.get_argument("countryId")

        schema = Schema({
            Required("gameId"): All(int),
        #    Required("countryId"): All(unicode, Length(min=1))
        })

        try:
            validUserInput = schema(userInput)
        except MultipleInvalid as e:
            print str(e)
            self.send_error(400)
            return


        #Make it so that only the game creator can change the settings
        if (self.current_user is not self.gamesManager.getGame(validUserInput['gameId']).creatorId):
            self.send_error(403)
            return

"""Joins a game listing"""
class LobbyGameJoinHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):


        userInput = {}
        userInput['gameId'] = int(params["gameId"])
        schema = Schema({
            Required("gameId"): All(int),
        })

        try:
            validUserInput = schema(userInput)
        except MultipleInvalid as e:
            print str(e)
            self.send_error(400)
            return

        self.gamesManager.getGame(validUserInput['gameId'])

        if (self.gamesManager.getGame(gameId).addPlayer(1, "aaa")):
            self.redirect("/lobby")
            #self.write("Joining game :D")
        else:
            self.write("Something went wrong :(")








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



