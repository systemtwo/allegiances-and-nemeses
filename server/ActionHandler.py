import tornado.web

from voluptuous import Schema, Required, All, Range

from AuthHandlers import BaseAuthHandler

import json



class ActionHandler(BaseAuthHandler):
    def initialize(self, config, boardsManager):
        super(ActionHandler, self).initialize(config=config)
        self.boardsManager = boardsManager

    @tornado.web.authenticated
    def post(self, **params):
        board = self.boardsManager.getBoard(int(params["boardId"]))
        if not board:
            self.send_error(404)
            return

        # try:
        schema = Schema({
            Required("action"): unicode,
        }, extra=True)

        requestData = schema(json.loads(self.request.body))

        # except:
        #     self.send_error(400)
        #     return


        #See if it is the user's turn
        if not board.isPlayersTurn(self.current_user):
            self.send_error(403) #Forbidden

        #We are safe to do this, because we return in the except call (thereby eliminating the 
        #case where requestData is not set
        action = requestData["action"]

        if "nextPhase" == action:
            # TODO improve error handling
            self.assertPhase(requestData["currentPhase"], board)
            board.currentPhase.nextPhase()

        elif "buy" == action:
            # buy units, with validation
            self.assertPhase("BuyPhase", board)
            success = board.currentPhase.setBuyList(requestData["boughtUnits"])
            if success:
                board.currentPhase.nextPhase()
            self.write(json.dumps({"success": success}))

        elif "selectConflict" == action:
            self.assertPhase("ResolvePhase", board)
            territory = board.territoryByName(requestData["territory"])
            board.currentPhase.selectConflict(territory)
            
        elif "battleTick" == action:
            self.assertPhase("ResolvePhase", board)
            territory = board.territoryByName(requestData["territory"])
            assert(territory == board.currentPhase.currentConflict)

        elif "retreat" == action:
            self.assertPhase("ResolvePhase", board)
            fromTerritory = board.territoryByName(requestData["from"])
            toTerritory = board.territoryByName(requestData["to"])
            assert(fromTerritory == board.currentPhase.currentConflict)
            board.currentPhase.retreat(fromTerritory, toTerritory)

        elif "autoResolve" == action:
            self.assertPhase("ResolvePhase", board)
            territory = board.territoryByName(requestData["territory"])
            board.currentPhase.autoResolve(territory)

        elif "autoResolveAll" == action:
            self.assertPhase("ResolvePhase", board)
            board.currentPhase.autoResolveAll()

        elif "placeUnit" == action:
            self.assertPhase("PlacementPhase", board)
            board.currentPhase.place(requestData["unitType"], requestData["territory"])

        elif "getEventLog" == action:
            pass # TODO


    def assertPhase(self, phaseName, board):
        if phaseName is not board.currentPhase.name:
            self.send_error(400)




