#TODO:
#I think we can remove the validation for the gameId url param
import os.path
import json

import tornado.web
import tornado.template
from voluptuous import Schema, Required, All, Range, Length, MultipleInvalid, Optional

import GameBoard
from AuthHandlers import BaseAuthHandler
import Sessions


# Lobby Route Handlers **
from Game import GameException


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


"""
Serves a page that has the details of the game listing (GameInfo)

Also implicitly causes player to join the game
"""
class LobbyGameHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, gameId):
        loader = tornado.template.Loader(self.LOBBY_HTML_PATH)
        gameId = int(gameId)
        if not self._game_id_valid(gameId):
            self.send_error(404)
            return

        userSession = Sessions.SessionManager.getSession(self.current_user)
        userid = userSession.getValue("userid")
        username = userSession.getValue("username")

        #We assume if you are hitting this page, you want to join the game
        game = self.gamesManager.getGame(gameId)
        game.addPlayer(userid, username)

        moduleNames = ["napoleon"]
        modules = []
        for moduleName in moduleNames:
            moduleInfo = {}

            with open(GameBoard.Util.countryFileName(moduleName)) as countryInfo:
                moduleInfo["countries"] = countryInfo.read()

            modules.append(moduleInfo)

        self.write(loader.load("lobbygameinfo.html").generate(gameId=gameId, userId=userid, modules=json.dumps(modules)))


## API routes

"""
Returns the game info as a JSON object
"""
class LobbyGameInfoHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def get(self, gameId):
        gameId = int(gameId)
        if not self._game_id_valid(gameId):
            self.send_error(404)

        game = self.gamesManager.getGame(gameId)

        gameInfo = game.toDict()

        self.finish(gameInfo)


"""
Joins a game listing

The user will be added to the players list and the player will be 
redirected to the game detail page
"""
class LobbyGameJoinHandler(BaseLobbyHandler):
    def initialize(self, config, gamesManager, lobbySocket):
        super(LobbyGameJoinHandler, self).initialize(config, gamesManager)
        self.lobbySocket = lobbySocket

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

        gameId = validUserInput['gameId']
        game = self.gamesManager.getGame(gameId)

        userSession = Sessions.SessionManager.getSession(self.current_user)
        if game.addPlayer(userSession.getValue("userid"), userSession.getValue("username")):
            self.lobbySocket.notifyLobby(game, gameId)
            self.redirect("/lobby/" + str(validUserInput['gameId']))
        else:
            self.send_error(500)


"""Initiates a game from a game listing"""
class LobbyGameBeginHandler(BaseLobbyHandler):
    def initialize(self, config, gamesManager, lobbySocket):
        super(LobbyGameBeginHandler, self).initialize(config, gamesManager)
        self.lobbySocket = lobbySocket

    @tornado.web.authenticated
    def post(self, **params):
        gameId = int(params['gameId'])
        if not self._game_id_valid(gameId):
            self.send_error(500)
            return

        game = self.gamesManager.getGame(gameId)
        try:
            game.startGame()
        except GameException as e:
            # TODO dschwarz handle this on the client and display reason
            raise tornado.web.HTTPError(500, reason = e.message)

        self.lobbySocket.beginGame(gameId)


"""Updates the settings of a game"""
class LobbyGameUpdateHandler(BaseLobbyHandler):
    def initialize(self, config, gamesManager, lobbySocket):
        super(LobbyGameUpdateHandler, self).initialize(config, gamesManager)
        self.lobbySocket = lobbySocket

    @tornado.web.authenticated
    def post(self, **params):
        gameId = int(params['gameId'])
        if not self._game_id_valid(gameId):
            self.send_error(500)
            return

        userData = json.loads(self.request.body)

        schema = Schema({
            Optional("countryPlayer"): All([Schema({"country": unicode, "userId": unicode})]),
            Optional("gameName"): All(unicode),
            Optional("maxPlayers"): All(int),
            Optional("moduleName"): All(unicode),
        })
        game = self.gamesManager.getGame(int(gameId))

        try:
            validUserInput = schema(userData)
            if "countryPlayer" in validUserInput:
                self._set_country_players(game, validUserInput['countryPlayer'])
            if "gameName" in validUserInput:
                self._set_game_name(game, validUserInput['gameName'])
            if "maxPlayers" in validUserInput:
                self._set_num_players(game, validUserInput['maxPlayers'])
            if "moduleName" in validUserInput:
                self._set_module_name(game, validUserInput['moduleName'])

        except MultipleInvalid as e:
            print(e.error_message)
            self.send_error(403)
            return

        self.lobbySocket.notifyLobby(game, gameId)

    def _set_game_name(self, game, name):
        game.name = name

    def _set_num_players(self, game, num_players):
        game.maxPlayers = num_players

    def _set_module_name(self, game, module_name):
        game.newBoard(module_name)

    def _set_country_players(self, game, country_player_map):
        countries = [entry['country'] for entry in country_player_map]
        assert len(countries) == len(set(countries)), "A country can only be assigned to one player"

        # Reset and set player country map
        game.clearAllPlayerCountries()

        for entry in country_player_map:
            game.addPlayerCountry(entry['userId'], entry['country'])


"""Deletes a game listing"""
class LobbyGameDeleteHandler(BaseLobbyHandler):
    @tornado.web.authenticated
    def post(self, **params):
        gameId = int(params['gameId'])
        if not self._game_id_valid(gameId):
            self.send_error(500)
            return

        game = self.gamesManager.getGame(gameId)
        userSession = Sessions.SessionManager.getSession(self.current_user)
        if game.owner == userSession.getValue("userid"):
            self.gamesManager.deleteGame(gameId)
        else:
            self.send_error(403)
            return
