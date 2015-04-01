import os.path
import tornado.web
from AuthHandlers import BaseAuthHandler

class GameHandler(BaseAuthHandler):
    def initialize(self, config):
        super(GameHandler, self).initialize(config=config)
        self.config = config


    @tornado.web.authenticated
    def get(self, **params):
        #FIXME
        self.render(os.path.join("..", self.config.STATIC_CONTENT_PATH, "html", "game.html"))



