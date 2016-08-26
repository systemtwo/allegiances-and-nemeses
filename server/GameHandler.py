import os.path
import tornado.web

import Sessions
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
        game_id = int(params['boardId'])
        userSession = Sessions.SessionManager.getSession(self.current_user)
        userId = userSession.getValue("userid")
        if self.gamesManager.getGame(game_id):
            self.render(os.path.join("..", self.config.STATIC_CONTENT_PATH, "html", "game.html"), gameId=game_id, userId=userId)
        else:
            self.send_error(404)
