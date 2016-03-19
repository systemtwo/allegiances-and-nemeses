import tornado.web
import tornado.template

from AuthHandlers import BaseAuthHandler
from utils import Enum, getSaveGames, deleteSaveGame


class SaveHandler(BaseAuthHandler):
    actions = Enum(["SAVE", "LOAD", "LIST_SAVES", "DELETE"])

    def initialize(self, config, action, gamesManager, html_path=""):
        super(SaveHandler, self).initialize(config=config)
        self.action = action
        self.gamesManager = gamesManager
        self.HTML_PATH = html_path

    @tornado.web.authenticated
    def get(self, **params):
        if self.action == self.actions.LOAD:
            gameId = self.gamesManager.loadGame(params['saveGameId'])
            self.redirect("/game/" + gameId)
        elif self.action == self.actions.LIST_SAVES:
            loader = tornado.template.Loader(self.HTML_PATH)
            savedGames = getSaveGames().values()
            self.write(loader.load("savedGames.html").generate(savedGames=savedGames))
        else:
            raise Exception("Invalid action " + self.action)

    @tornado.web.authenticated
    def post(self, **params):
        if self.action == self.actions.SAVE:
            self.gamesManager.saveGame(self.get_argument("gameId"), self.get_argument("name"))
            self.redirect("/saves")
        elif self.action == self.actions.DELETE:
            deleteSaveGame(params['saveGameId'])
            self.redirect("/saves")
        else:
            raise Exception("Invalid action " + self.action)