define(["gameAccessor"], function(_b) {
    // All router functions return the request object, which can then have done and fail handlers added to it
    function sendAction(data) {
        return $.ajax("/boards/" + _b.getBoard().id + "/action", {
            method: "POST",
            data: JSON.stringify(data),
            contentType: 'application/json'
        });
    }
    function newBoard() {
        return $.ajax("boards/new", {
            method: "POST"
        });
    }
    // Tell the server what you think the current phase is, and ask it to advance to the next. Ask it politely.
    // This is called by Attack, Move, and Place phases ONLY
    // Buy Phase ends with "endBuyPhase"
    // Resolve phase ends when there are no more conflicts
    function nextPhase() {
        return sendAction({
            action: "nextPhase",
            currentPhase: _b.getBoard().currentPhaseName() // get the class name
        });
    }
    function setBuyList(boughtUnits) {
        return sendAction({
            action: "buy",
            boughtUnits: boughtUnits
        })
    }
    function fetchBoard(boardId) {
        console.assert(boardId !== null, "Board Id not set");
        return $.getJSON("/boardInfo/" + boardId);
    }
    function validateMove(start, end, unitId, onfail) {
        return sendAction({
            action: "move",
            from: start.name,
            to: end.name,
            unitId: unitId
        }).fail(onfail)
    }

    /**
     * Resolves with an array of conflicts
     * @param boardId
     * @param fields {string|string[]} Field names to fetch values for
     * @returns {jQuery.Deferred} Resolves with an object, with a values keyed by given field names
     */
    function getFields(boardId, fields) {
        return $.getJSON("/getFields/" + boardId, {fieldNames: fields});
    }
    function battle(territoryName) {
        // Perform one tick of a battle
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "battleTick",
            territory: territoryName
        });
    }
    function retreat(conflictTerritory, destination) {
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "retreat",
            from: conflictTerritory,
            to: destination
        });
    }
    function autoResolve(conflictId) {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        return sendAction({
            action: "autoResolve",
            conflictId: conflictId
        });
    }
    function autoResolveAll() {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        var request = sendAction({
            action: "autoResolveAll"
        });
        request.fail(function onFail(){
            // Show an error?
        });
        return request;
    }
    function placeUnit(territoryName, unitType) {
        return sendAction({
            action: "placeUnit",
            territory: territoryName,
            unitType: unitType
        });
    }
    function getEventLog() {
        return sendAction({
            action: "getEventLog"
        });
    }
    return {
        newBoard: newBoard,
        setBuyList: setBuyList,
        fetchBoard: fetchBoard,
        getFields: getFields,
        validateMove: validateMove,
        battle: battle,
        autoResolve: autoResolve,
        autoResolveAll: autoResolveAll,
        retreat: retreat,
        placeUnit: placeUnit,
        nextPhase: nextPhase
    }

});
