import os.path
import tornado.web
from AuthHandlers import BaseAuthHandler

class GameHandler(BaseAuthHandler):
    def initialize(self, config, gamesManager):
        super(GameHandler, self).initialize(config=config)
        self.config = config
        self.gamesManager = gamesManager


    @tornado.web.authenticated
    def get(self, **params):
        game_id = int(params['boardId'])
        if self.gamesManager.getGame(game_id):
            self.render(os.path.join("..", self.config.STATIC_CONTENT_PATH, "html", "game.html"))
        else:
            self.send_error(404)
