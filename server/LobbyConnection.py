import sockjs.tornado


class LobbyConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    # Class level variable
    participants = set()

    def on_open(self, info):
        # Send that someone joined
        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone joined'
        })

        self.userId = info.get_argument('userId')
        self.gameId = int(info.get_argument('gameId'))

        # Add client to the clients list
        self.participants.add(self)

    def on_close(self):
        # Remove client from the clients list and broadcast leave message
        self.participants.remove(self)

        self.broadcast(self.participants, {
            'type': 'message',
            'payload': 'Someone left'
        })


class LobbySocketRouter(sockjs.tornado.SockJSRouter):
    def notifyLobby(self, game, gameId):
        self.broadcast(self.participantsForGame(gameId), {
            'type': 'gameUpdate',
            'payload': game.toDict()
        })

    def beginGame(self, gameId):
        self.broadcast(self.participantsForGame(gameId), {
            'type': 'beginGame'
        })

    def participantsForGame(self, gameId):
        return [p for p in self._connection.participants if p.gameId == gameId]