_idCounter = 0
def getUniqueId():
    global _idCounter
    _idCounter += 1
    return _idCounter