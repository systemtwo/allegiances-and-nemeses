define(["knockout"], function (ko) {

    // Taken from knockout website
    ko.extenders.numeric = function(target, enableExtension) {
        //create a writable computed observable to intercept writes to our observable
        if (enableExtension) {
            return ko.pureComputed({
                read: target,  //always return the original observables value
                write: function(newValue) {
                    var current = target(),
                        newValueAsNum = parseFloat(+newValue);

                    //only write if it changed
                    if (!isNaN(newValueAsNum) && newValueAsNum !== current) {
                        target(newValueAsNum);
                    } else if (newValue !== current) {
                        target.notifySubscribers(current);
                    }
                }
            }).extend({ notify: 'always' });
        } else {
            return target;
        }
    };

    ko.observableArray.fn.pushAll = function(valuesToPush) {
        var underlyingArray = this();
        this.valueWillMutate();
        ko.utils.arrayPushAll(underlyingArray, valuesToPush);
        this.valueHasMutated();
        return this;
    };
});