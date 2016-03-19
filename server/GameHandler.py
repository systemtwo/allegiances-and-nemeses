import os.path
import tornado.web
from AuthHandlers import BaseAuthHandler
from ErrorRenderMixin import ErrorRenderMixin

class GameHandler(ErrorRenderMixin, BaseAuthHandler):
    def initialize(self, config, gamesManager):
        super(GameHandler, self).initialize(config=config)
        self.config = config
        self.gamesManager = gamesManager

        self.ERROR_TEMPLATE_PATH = os.path.join(config.STATIC_CONTENT_PATH, "html")

    @tornado.web.authenticated
    def get(self, **params):
        game_id = str(params['boardId'])
        if self.gamesManager.getGame(game_id):
            self.render(os.path.join("..", self.config.STATIC_CONTENT_PATH, "html", "game.html"))
        else:
            self.send_error(404)
