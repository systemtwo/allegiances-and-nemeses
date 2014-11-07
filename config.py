import os.path


#Careful with these, these are actually one level up from this folder
#Maybe move these to an actual config (eg. ini, json) file?
STATIC_CONTENT_PATH = os.path.join("client")
SHARED_CONTENT_PATH = os.path.join("shared")
rootDirectory = os.path.dirname(__file__)
MODS_PATH = os.path.join("shared/mods")
ABS_MODS_PATH = os.path.join(rootDirectory, "shared/mods")
DEFAULT_IMAGE_PATH = "/static/css/images/defaultMap.jpg"

