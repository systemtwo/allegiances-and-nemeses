import time
import uuid

#Private class!
#Manages Sessions
class _SessionManager():
    def __init__(self):
        self.sessions = dict()

    def getSession(self, sessionId):
        if (not self.getSessionExists(sessionId)):
            self.sessions[sessionId] = Session()


        #TODO:We need to handle session expiry 
        #if (self.sessions[sessionId].expireTime < time.time()):
            ##Delete the session if it is past its expiry time
            #self.sessions.pop(sessionId, None)


        

        return self.sessions[sessionId]

    #Test to see if a session exists without creating a new one
    def getSessionExists(self, sessionId):
        return sessionId in self.sessions

    def sessionCount(self):
        return len(self.sessions)

    #Static methods
    def generateToken(self):
        return str(int(time.time())) + str(uuid.uuid4())

#Session object that holds user data on the server side
#This is meant for short term data storage
class Session:
    SESSION_TIME_TO_LIVE = 24 * 3600 #Session has one day to "live"

    def __init__(self):
        self.values = dict()
        self.expireTime = int(time.time()) + Session.SESSION_TIME_TO_LIVE

    def setValue(self, key, value):
        #We reset the TTL timer when the session object is used
        self.expireTime = int(time.time()) + Session.SESSION_TIME_TO_LIVE
        self.values[key] = value
        return

    def getValue(self, key, default=None):
        #We reset the TTL timer when the session object is used
        self.expireTime = int(time.time()) + Session.SESSION_TIME_TO_LIVE
        return self.values[key]



#We make a globally accessable Sessionmanager tied to this module
SessionManager = _SessionManager()
print("Created SessionManager")
