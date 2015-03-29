import tornado.web
import uuid

class BaseAuthHandler(tornado.web.RequestHandler):
    def initialize(self, config):
        self.authenticateUser = config.USER_AUTH

    def get_current_user(self):
        if self.authenticateUser:
            return self.get_secure_cookie("session")
        else:
            return True

    def setAuthenticateUser(self, value):
        self.authenticateUser = value


class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_secure_cookie("session", uuid.uuid4().hex)
        
        #TODO: Fix this. An attacker can use this to use the server to redirect somewhere else
        self.redirect(self.get_argument("next", u"/"))
        return


class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_cookie("session")
        pass
