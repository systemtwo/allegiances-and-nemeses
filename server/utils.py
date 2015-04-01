import tornado.ioloop
import tornado.web


# A File handler that always serves files
class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")

    def should_return_304(self):
        return False


#A quick Enum class based on a set (the data structure)
#From http://stackoverflow.com/a/2182437
class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError

    def __delattr__(self, name):
        pass

    def __setattr__(self, name, **kwargs):
        pass

