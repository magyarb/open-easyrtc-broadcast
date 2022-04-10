// Load required modules
require("dotenv").config();
var isDev = process.env.NODE_ENV === "development" ? true : false;
var http = require("http"); // http server core module
var express = require("express"); // web framework external module
var serveStatic = require("serve-static"); // serve static files
var socketIo = require("socket.io"); // web socket external module
const port = isDev ? 3002 : 80;

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("open-easyrtc");"
// 2. install easyrtc (npm i open-easyrtc --save) in server_example/package.json

var easyrtc = require("../"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic("static", { index: ["index.html"] }));

// Cross-domain workaround presented below:
/*
socketServer.origins(function(origin, callback) {
    if (origin && ![
        'http://localhost:8080',
        '*'
    ].includes(origin)) {
        return callback('origin not allowed', false);
    }
    callback(null, true);
});
*/

if (isDev) {
  var http = require("http");
  var server = http.createServer(app);
  server.listen(port);
  serverReady(server);
  console.log("listening in dev mode on", port);
} else {
  require("greenlock-express")
    .init({
      packageRoot: __dirname,
      configDir: "./greenlock.d",

      // contact for security and critical bug notices
      maintainerEmail: "magyarb94@gmail.com",

      // whether or not to run at cloudscale
      cluster: false,
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .ready(addIO);
}

function addIO(glx) {
  glx.serveApp(app);
  var server = glx.httpsServer();
  serverReady(server);
  // Start Socket.io so it attaches itself to Express server
}

function serverReady(server) {
  var socketServer = socketIo.listen(server, { "log level": 1 });

  easyrtc.setOption("logLevel", "debug");

  // Overriding the default easyrtcAuth listener, only so we can directly access its callback
  easyrtc.events.on(
    "easyrtcAuth",
    function (socket, easyrtcid, msg, socketCallback, callback) {
      easyrtc.events.defaultListeners.easyrtcAuth(
        socket,
        easyrtcid,
        msg,
        socketCallback,
        function (err, connectionObj) {
          if (
            err ||
            !msg.msgData ||
            !msg.msgData.credential ||
            !connectionObj
          ) {
            callback(err, connectionObj);
            return;
          }

          connectionObj.setField("credential", msg.msgData.credential, {
            isShared: false,
          });

          console.log(
            "[" + easyrtcid + "] Credential saved!",
            connectionObj.getFieldValueSync("credential")
          );

          callback(err, connectionObj);
        }
      );
    }
  );

  // To test, lets print the credential to the console for every room join!
  easyrtc.events.on(
    "roomJoin",
    function (connectionObj, roomName, roomParameter, callback) {
      console.log(
        "[" + connectionObj.getEasyrtcid() + "] Credential retrieved!",
        connectionObj.getFieldValueSync("credential")
      );
      easyrtc.events.defaultListeners.roomJoin(
        connectionObj,
        roomName,
        roomParameter,
        callback
      );
    }
  );

  // Start EasyRTC server
  var rtc = easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on(
      "roomCreate",
      function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(
          appObj,
          creatorConnectionObj,
          roomName,
          roomOptions,
          callback
        );
      }
    );
  });
}
