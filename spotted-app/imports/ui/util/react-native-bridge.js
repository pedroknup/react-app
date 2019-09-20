import { devices } from "../redux/constants/enums";

var promiseChain = Promise.resolve();
var callbacks = {};
export var initBridge = function () {
  const guid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  };
  window.webViewBridge = {
    /**
     * send message to the React-Native WebView onMessage handler
     * @param targetFunc - name of the function to invoke on the React-Native side
     * @param data - data to pass
     * @param success - success callback
     * @param error - error callback
     */
    send: function (targetFunc, data, success, error) {
      var msgObj = {
        targetFunc: targetFunc,
        data: data || {}
      };
      if (success || error) {
        msgObj.msgId = guid();
      }
      var msg = JSON.stringify(msgObj);
      promiseChain = promiseChain
        .then(function () {
          return new Promise(function (resolve, reject) {
            if (msgObj.msgId) {
              callbacks[msgObj.msgId] = {
                onsuccess: success,
                onerror: error
              };
            }
            window.ReactNativeWebView.postMessage(msg);
            resolve();
          });
        })
        .catch(function (e) {
          error();
        });
    }
  };
  window.addEventListener("message", function (e) {
    var message;
    try {
      message = JSON.parse(e.data);
    } catch (err) {
      return;
    }
    //trigger callback
    if (callbacks[message.msgId]) {
      if (message.isSuccessfull && message.args) {
        callbacks[message.msgId].onsuccess.apply(null, message.args);
      } else {
        callbacks[message.msgId].onerror.apply(null, message.args);
      }
      delete callbacks[message.msgId];
    }
  });
};

export function checkBridge() {
  if (window.webViewBridge !== undefined && window.webViewBridge !== null) {
    return true;
  }
  alert("App not running under React Native!");
  return false;
}

const checkOS = device => {
  device = Array.isArray(device) ? device : [device];

  if (device.includes("iPhone")) {
    const version = device.replace("iPhone", "");
    try {
      if (parseInt(version) >= 10.0) return devices.IOS_NOTCH;
      else return devices.IOS;
    } catch (e) {
      // return devices.IOS;
      return devices.ANDROID;
    }
  }
  return devices.ANDROID;
};

export function getDeviceId(callback, err) {
  let toReturn = "";

  if (!window.webViewBridge.send) {
    err();
    return;
  }
  window.webViewBridge.send(
    "getDeviceId",
    "",
    function (res) {
      const device = checkOS(res);
      callback(device);
    },
    function (err) {
      callback(devices.ANDROID);
    }
  );
}
export function getGeolocation(callback, err) {
  try {
    if (window.webViewBridge.send)
      window.webViewBridge.send(
        "getGeolocation",
        "",
        function (res) {
          // alert(JSON.stringify(res));
          callback(res.coords);
        },
        function (err) {
          // callback(devices.WEB);
          callback({
            latitude: 0,
            longitude: 0
          });
          // callback(devices.IOS_NOTCH); //dev env
        }
      );
  } catch (e) {
    callback({ coords: { latitude: 0, longitude: 0 } });
  }
}

export function uploadPicture(callback, err) {
  try {
    window.webViewBridge.send(
      "uploadPicture",
      "",
      function (res) {
        callback(res);
      },
      function (e) {
        err();
      }
    );
  } catch (e) {
    callback({ source: "" });
  }
}
export function getUniqueId(callback, err) {
  let toReturn = "";

  if (!window.webViewBridge.send) {
    err();
    return;
  }
  window.webViewBridge.send(
    "getUniqueId",
    "",
    function (res) {
      callback(res);
      // callback(devices.IOS);
    },
    function (err) {
      callback("web");
    }
  );
}
