import os.path


#Careful with these, these are actually one level up from this folder
#Maybe move these to an actual config (eg. ini, json) file?
rootDirectory = os.path.dirname(__file__)

STATIC_CONTENT_PATH = os.path.join("client")
SHARED_CONTENT_PATH = os.path.join("shared")
MODS_PATH = os.path.join("shared/mods")
ABS_MODS_PATH = os.path.join(rootDirectory, "shared/mods")
DEFAULT_IMAGE_PATH = "/static/css/images/defaultMap.jpg"

COOKIE_SECRET = "some_secret_value"


#Debugging
USER_AUTH = False
