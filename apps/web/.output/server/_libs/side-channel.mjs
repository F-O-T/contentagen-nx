import { r as requireType } from "./es-errors.mjs";
import { r as requireObjectInspect } from "./object-inspect.mjs";
import { r as requireSideChannelList } from "./side-channel-list.mjs";
import { r as requireSideChannelMap } from "./side-channel-map.mjs";
import { r as requireSideChannelWeakmap } from "./side-channel-weakmap.mjs";
var sideChannel;
var hasRequiredSideChannel;
function requireSideChannel() {
  if (hasRequiredSideChannel) return sideChannel;
  hasRequiredSideChannel = 1;
  var $TypeError = /* @__PURE__ */ requireType();
  var inspect = /* @__PURE__ */ requireObjectInspect();
  var getSideChannelList = /* @__PURE__ */ requireSideChannelList();
  var getSideChannelMap = /* @__PURE__ */ requireSideChannelMap();
  var getSideChannelWeakMap = /* @__PURE__ */ requireSideChannelWeakmap();
  var makeChannel = getSideChannelWeakMap || getSideChannelMap || getSideChannelList;
  sideChannel = function getSideChannel() {
    var $channelData;
    var channel = {
      assert: function(key) {
        if (!channel.has(key)) {
          throw new $TypeError("Side channel does not contain " + inspect(key));
        }
      },
      "delete": function(key) {
        return !!$channelData && $channelData["delete"](key);
      },
      get: function(key) {
        return $channelData && $channelData.get(key);
      },
      has: function(key) {
        return !!$channelData && $channelData.has(key);
      },
      set: function(key, value) {
        if (!$channelData) {
          $channelData = makeChannel();
        }
        $channelData.set(key, value);
      }
    };
    return channel;
  };
  return sideChannel;
}
export {
  requireSideChannel as r
};
