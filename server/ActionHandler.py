import json
import tornado.web
from server import BoardCollection


class ActionHandler(tornado.web.RequestHandler):
    def get(self, **params):
        try:
            require(["boardId"], params)
            board = BoardCollection.getBoard(params["boardId"])

            action = self.get_argument("action")
            if "buy" == action:
                # buy units, with validation
                self.assertPhase("BuyPhase", board)
                success = board.currentPhase.setBuyList(json.loads(self.get_argument("boughtUnits")))
                if success:
                    board.currentPhase.nextPhase()
                self.write(json.dumps({"success": success}))
            elif "nextPhase" == action:
                # TODO improve error handling
                self.assertPhase(self.get_argument("currentPhase"), board)
                board.currentPhase.nextPhase()
            elif "selectConflict" == action:
                self.assertPhase("ResolvePhase", board)
                territory = board.territoryByName(self.get_argument("territory"))
                board.currentPhase.selectConflict(territory)
            elif "battleTick" == action:
                self.assertPhase("ResolvePhase", board)
                territory = board.territoryByName(self.get_argument("territory"))
                assert(territory == board.currentPhase.currentConflict)
            elif "retreat" == action:
                self.assertPhase("ResolvePhase", board)
                fromTerritory = board.territoryByName(self.get_argument("from"))
                toTerritory = board.territoryByName(self.get_argument("to"))
                assert(fromTerritory == board.currentPhase.currentConflict)
                board.currentPhase.retreat(fromTerritory, toTerritory)
            elif "autoResolve" == action:
                self.assertPhase("ResolvePhase", board)
                territory = board.territoryByName(self.get_argument("territory"))
                board.currentPhase.autoResolve(territory)
            elif "autoResolveAll" == action:
                self.assertPhase("ResolvePhase", board)
                board.currentPhase.autoResolveAll()
            elif "placeUnit" == action:
                self.assertPhase("PlacementPhase", board)
                board.currentPhase.place(self.get_argument("unitType"), self.get_argument("territory"))
            elif "getEventLog" == action:
                pass # TODO

        except MissingParamException as e:
            print(e)
            self.send_error()

    def assertPhase(self, phaseName, board):
        if phaseName is not board.currentPhase.name:
            self.send_error()




def require(attributes, dictionary):
    for attr in attributes:
        if attr not in dictionary:
            raise MissingParamException("Attribute not found in parameters: " + attr)


class MissingParamException(Exception):
    pass