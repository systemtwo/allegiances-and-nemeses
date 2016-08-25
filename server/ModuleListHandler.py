import json
import tornado.web

import GameBoard

"""
Lists all modules
"""
class ModuleListHandler(tornado.web.RequestHandler):

    def initialize(self, config):
        self.config = config

    def get(self):
        moduleNames = ["napoleon"]
        # moduleNames = getModulesNames()

        moduleInfos = []
        for moduleName in moduleNames:
            moduleInfo = {
                "name": moduleName
            }
            with open(GameBoard.Util.countryFileName(moduleName)) as countryInfo:
                moduleInfo["countries"] = json.loads(countryInfo.read())
            moduleInfos.append(moduleInfo)

        self.write(json.dumps(moduleInfos))