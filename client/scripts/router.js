define(function() {
    // change to set from client
    var id;
    function sendToServer(data) {
        return $.ajax("/boards/" + id + "/action", {
            data: data
        })
    }
    function endBuyPhase(boughtUnits) {
        var request = sendToServer({
            action: "buy",
            boughtUnits: JSON.stringify(boughtUnits)
        });
        request.done(function() {
            console.log(arguments)
        })
    }
    function fetchBoard(boardId, onSuccess) {
        id = boardId;
        $.getJSON("/boards/" + boardId).done(onSuccess);
    }
    return {
        endBuyPhase: endBuyPhase,
        fetchBoard: fetchBoard
    }

});
