var Transform = require('stream').Transform;
var util = require("util");

function IsSilence(options) {
    var that = this;
    if (options && options.debug) {
      that.debug = options.debug;
      delete options.debug;
    }
    Transform.call(that, options);
    var consecSilenceCount = 0;
    var silenceFramesThreshold = 0;

    that.getSilenceFramesThreshold = function getSilenceFramesThreshold() {
        return silenceFramesThreshold;
    };

    that.getSilenceVolumeThreshold = function getSilenceVolumeThreshold() {
        return silenceVolumeThreshold;
    };

    that.getConsecSilenceCount = function getConsecSilenceCount() {
        return consecSilenceCount;
    };

    that.setSilenceFramesThreshold = function setSilenceFramesThreshold(frames) {
        silenceFramesThreshold = frames;
        return;
    };

    that.setSilenceVolumeThreshold = function setSilenceVolumeThreshold(vol) {
        silenceVolumeThreshold = vol;
        return;
    };

    that.resetConsecSilenceCount = function resetConsecSilenceCount() {
        consecSilenceCount = 0;
        return;
    };
};
util.inherits(IsSilence, Transform);

IsSilence.prototype._transform = function(chunk, encoding, callback) {
    var i;
    var speechSample;
    var silenceLength = 0;
    var self = this;
    var debug = self.debug;
    var consecutiveSilence = self.getConsecSilenceCount();
    var silenceFramesThreshold = self.getSilenceFramesThreshold();
    var resetConsecSilence = self.resetConsecSilenceCount;

    if(silenceFramesThreshold) {
        for(i=0; i<chunk.length; i=i+2) {
            if(chunk[i+1] > 128) {
                speechSample = (chunk[i+1] - 256) * 256;
            } else {
                speechSample = chunk[i+1] * 256;
            }
            speechSample += chunk[i];

            if(Math.abs(speechSample) > silenceFramesThreshold) {
                if (debug) {
                  console.log("Found speech block");
                }
                self.emit('sound');
                resetConsecSilence();
                break;
            } else {
                silenceLength++;
            }

        }
        if(silenceLength == chunk.length/2) {
            if (debug) {
              console.log("Found silence block: %d of %d", consecutiveSilence, silenceFramesThreshold);
            }
            self.emit('silence');
        }
    }
    this.push(chunk);
    callback();
};

module.exports = IsSilence;
