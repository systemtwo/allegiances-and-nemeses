import os.path


#Careful with these, these are actually one level up from this folder
#Maybe move these to an actual config (eg. ini, json) file?
STATIC_CONTENT_PATH = os.path.join("client")

unitListFile = os.path.join("shared", "UnitList.json")
territoryListFile = os.path.join("shared", "TerritoryList.json")

