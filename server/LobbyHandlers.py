#TODO:
#I think we can remove the validation for the gameId url param
import os.path

import tornado.web
from voluptuous import Schema, Required, All, Range, Length, MultipleInvalid

from AuthHandlers import BaseAuthHandler
import Sessions


## Lobby Route Handlers **
class BaseLobbyHandler(BaseAuthHandler):
    def initialize(self, config, gamesManager):
        super(BaseLobbyHandler, self).initialize(config=config)
        self.config = config
        self.gamesManager = gamesManager
        
        self.LOBBY_HTML_PATH = os.path.join(self.config.STATIC_CONTENT_PATH, "html", "lobby")

    def _game_id_valid(self, game_id):
        #Ensure the game_id is an int
        try:
            schema = Schema({
                Required("gameId"): All(int),
            })
            userInput = {"gameId": int(game_id)}
            validUserInput = schema(userInput)
        except MultipleInvalid as e:
            return False

        #Ensure the game has been created
        if (self.gamesManager.getGame(int(game_id))):
            return True
        return False


"""Serves the lobby page"""
class LobbyHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        renderArguments = {}
        renderArguments["listings"] = self.gamesManager.listGames()
        
        self.render(os.path.join("..", self.LOBBY_HTML_PATH, "lobby.html"), **renderArguments)


"""Serves a page that allows a game listing to be created"""
class LobbyCreateHandler(BaseLobbyHandler):
    defaults = {
        "roomName": "Untitled Room",
        "players": 1,
        "module": "napoleon", #This should be a more sensible default
        "owner": None,
    }

    @tornado.web.authenticated
    def get(self, **params):
        #Create an empty game room and redirect the user to that room
        userSession = Sessions.SessionManager.getSession(self.current_user)

        gameSettings = self.defaults.copy()
        gameSettings.update({
            "owner": userSession.getValue("userid"),
        })

        gameId = self.gamesManager.newGame(
            gameSettings["roomName"],
            gameSettings["players"],
            gameSettings["module"],
            gameSettings["owner"])

        self.redirect("/lobby/" + str(gameId))


"""Serves a page that has the details of the game listing (GameInfo)"""
class LobbyGameHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, gameId):
        gameId = int(gameId)
        if not self._game_id_valid(gameId):
            self.send_error(404)
            return

        userSession = Sessions.SessionManager.getSession(self.current_user)
        userid = userSession.getValue("userid")

        #We assume if you are hitting this page, you want to join the game
        game = self.gamesManager.getGame(gameId)
        game.addPlayer(userid)

        self.render(os.path.join("..", self.LOBBY_HTML_PATH, "lobbygameinfo.html"))

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
            print(str(e))
            self.send_error(400)
            return

        #FIXME: I disabled this for debugging purposes
        ##Make it so that only the game creator can change the settings
        #if (self.current_user is not self.gamesManager.getGame(validUserInput['gameId']).creatorId):
            #self.send_error(403)
            #return


        game = self.gamesManager.getGame(validUserInput['gameId'])


        #FIXME
        #Before we set the user countries, we clear all player<->country associations
        #for player in game.listPlayers():
            #game.clearPlayerCountries(self.current_user)

        #FIXME
        #We grab each country entry, and put it in the player's list
        for country in game.getCountries():
            player = self.get_argument("country-selection-" + str(country.name))
            game.addPlayer(player)
            game.addPlayerCountry(player, country.name)

        game.startGame()
        #FIXME: use os.path.join or something
        self.redirect(u"/game/" + str(validUserInput["gameId"]))


class LobbyGameInfoHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, gameId):
        gameId = int(gameId)
        if not self._game_id_valid(gameId):
            self.send_error(404)

        game = self.gamesManager.getGame(gameId)

        gameInfo = {
            "name": game.name,
            "players": game.listPlayers(),
            "maxPlayers": game.maxPlayers,
            "creatorId": game.creatorId,
            "moduleName": game.moduleName,
            "started": game.started,
        }

        self.finish(gameInfo)


"""
Joins a game listing

The user will be added to the players list and the player will be 
redirected to the game detail page
"""
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
            print(str(e))
            self.send_error(400)
            return

        self.gamesManager.getGame(validUserInput['gameId'])

        userSession = Sessions.SessionManager.getSession(self.current_user)
        if self.gamesManager.getGame(validUserInput['gameId']).addPlayer(userSession.getValue("userid")):
            self.redirect("/lobby/" + str(validUserInput['gameId']))
            #self.write("Joining game :D")
        else:
            self.send_error(500)
            self.write("Something went wrong :(")


"""Initiates a game from a game listing"""
class LobbyGameBeginHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, **params):
        game = self.gamesManager.getGame(params['gameId'])
        game.started = True
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



