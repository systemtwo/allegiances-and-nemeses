import os.path


#Careful with these, these are actually one level up from this folder
#Maybe move these to an actual config (eg. ini, json) file?
STATIC_CONTENT_PATH = os.path.join("client")
SHARED_CONTENT_PATH = os.path.join("shared")
# TODO shared/mods should be a config variable, replace all instances of that string
# DEFAULT_IMAGE_PATH = STATIC_CONTENT_PATH + "/css/images/defaultMap.jpg"

unitListFile = os.path.join("shared", "UnitList.json")
territoryListFile = os.path.join("shared", "TerritoryList.json")

