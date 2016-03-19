import sockjs.tornado
import Sessions

class GameConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    # Class level variable
    participants = set()

    def on_open(self, info):
        # Send that someone joined
        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone joined'
        })

        # self.userId = info.get_cookie("playerId").value
        self.gameId = info.get_argument('gameId')

        # Add client to the clients list
        self.participants.add(self)

    def on_close(self):
        # Remove client from the clients list and broadcast leave message
        self.participants.remove(self)

        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone left'
        })


class GameSocketRouter(sockjs.tornado.SockJSRouter):
    def notifyByGameId(self, gameId, gameState, excluded=None):
        if not excluded:
            excluded = []
        clients = [p for p in self._connection.participants if p.gameId == gameId]
        self.broadcast(clients, {
            'type': 'gameUpdate',
            'payload': gameState
        })
