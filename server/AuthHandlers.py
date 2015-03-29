import tornado.web

import Sessions

class BaseAuthHandler(tornado.web.RequestHandler):
    def initialize(self, config):
        self.authenticateUser = config.USER_AUTH

    def get_current_user(self):
        if self.authenticateUser:
            sessionCookie = self.get_secure_cookie("session")
            print "Session cookie is:", sessionCookie
            #FIXME: I feel that there is a better way to do this
            #We check to see if the user has a session active, if not, we will cause 
            #a new session to be created
            if (not Sessions.SessionManager.getSessionExists(sessionCookie)):
                print "Forcing session recreation"
                return None
            return sessionCookie
        else:
            return True

    def setAuthenticateUser(self, value):
        self.authenticateUser = value


class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        sessionId = Sessions.SessionManager.generateToken()
        self.set_secure_cookie("session", sessionId)

        #For now, everyone is a guest
        userNumber = Sessions.SessionManager.sessionCount() + 1
        userSession = Sessions.SessionManager.getSession(sessionId)
        userSession.setValue("username", "Guest_" + str(userNumber))
        #FIXME:This is VERY insecure
        userSession.setValue("userid", "Guest_" + str(userNumber))
        
        
        #TODO: Fix this. An attacker can use this to use the server to redirect somewhere else
        self.redirect(self.get_argument("next", u"/"))
        print "Created user", userNumber
        return



class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_cookie("session")
        self.redirect(u"/")
        pass






