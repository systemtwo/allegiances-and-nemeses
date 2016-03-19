import uuid


def getUniqueId():
    return uuid.uuid4()


def getUniqueIdWithOverride(overrideId):
    if overrideId:
        return overrideId
    else:
        return getUniqueId()
