import json

import tornado.escape

from AuthHandlers import BaseAuthHandler
from Sessions import SessionManager

class UserInfoHandler(BaseAuthHandler):
    def initialize(self, *args, **kwargs):
        super(UserInfoHandler, self).initialize(*args, **kwargs)

    def get(self):
        session_id = self.get_current_user()
        session = SessionManager.getSession(session_id)

        user_obj = {
            "name": session.getValue("username")
        }

        self.finish(json.dumps(user_obj))

    def post(self):
        data = tornado.escape.json_decode(self.request.body)

        #TODO: Validate this properly
        if "username" in data:
            session_id = self.get_current_user()
            session = SessionManager.getSession(session_id)

            #Escape username
            username = tornado.escape.xhtml_escape(data["username"])

            #Set new username
            session.setValue("username", username)

