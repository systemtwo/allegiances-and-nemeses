import tornado.web
import uuid

class BaseAuthHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("session")


class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_secure_cookie("session", uuid.uuid4().hex)
        self.redirect(self.get_argument("next", u"/"))
        return


class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_cookie("session")
        pass
