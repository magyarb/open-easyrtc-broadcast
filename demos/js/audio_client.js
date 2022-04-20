//
//Copyright (c) 2016, Skedans Systems, Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//
var selfEasyrtcid = "";

function disable(domId) {
  document.getElementById(domId).disabled = "disabled";
}

function enable(domId) {
  document.getElementById(domId).disabled = "";
}

function appInit() {
  connect();
}

function connect() {
  console.log("Initializing. client");
  easyrtc.enableVideo(false);
  easyrtc.enableVideoReceive(false);
  easyrtc.enableAudio(true);
  easyrtc.enableAudioReceive(true);
  easyrtc.enableMicrophone(false);
  easyrtc.setRoomOccupantListener(roomOccupantsChanged);
  easyrtc.connect("easyrtc.audioOnly", loginSuccess, loginFailure);
  /* easyrtc.initMediaSource(
    function () {
      // success callback
      
    },
    function (errorCode, errmesg) {
      easyrtc.showError(errorCode, errmesg);
    } // failure callback
  );*/
}

function terminatePage() {
  easyrtc.disconnect();
}

function hangup() {
  easyrtc.hangupAll();
  //disable("hangupButton");
}

function clearConnectList() {
  otherClientDiv = document.getElementById("otherClients");
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }
}

function roomOccupantsChanged(roomName, occupants, isPrimary) {
  console.log("roomOccupantsChanged", roomName, occupants, isPrimary);

  var acceptedCB = function (accepted, caller) {
    if (!accepted) {
      easyrtc.showError(
        "CALL-REJECTED",
        "Sorry, your call to " + easyrtc.idToName(caller) + " was rejected"
      );
      enable("otherClients");
    }
  };
  var successCB = function () {
    enable("hangupButton");
  };
  var failureCB = function () {
    enable("otherClients");
  };

  for (var oid of Object.keys(occupants)) {
    let occupant = occupants[oid];
    if (occupant.apiField.server) {
      console.log("found the server", occupant);
      //easyrtc.call(occupant.easyrtcid, successCB, failureCB, acceptedCB);
    }
  }
}

function performCall(otherEasyrtcid) {
  easyrtc.hangupAll();
  var acceptedCB = function (accepted, caller) {
    if (!accepted) {
      easyrtc.showError(
        "CALL-REJECTED",
        "Sorry, your call to " + easyrtc.idToName(caller) + " was rejected"
      );
      enable("otherClients");
    }
  };
  var successCB = function () {
    enable("hangupButton");
  };
  var failureCB = function () {
    enable("otherClients");
  };
  easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
}

function loginSuccess(easyrtcid, roomOwner) {
  console.log("loginSuccess", easyrtcid, roomOwner);
  //disable("connectButton");
  // enable("disconnectButton");
  enable("otherClients");
  selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtcid;
}

function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}

function disconnect() {
  document.getElementById("iam").innerHTML = "logged out";
  easyrtc.disconnect();
  console.log("disconnecting from server");
  enable("connectButton");
  // disable("disconnectButton");
  clearConnectList();
}

easyrtc.setStreamAcceptor(function (easyrtcid, stream) {
  console.log("setStreamAcceptor", easyrtcid);
  var audio = document.getElementById("callerAudio");
  easyrtc.setVideoObjectSrc(audio, stream);
  enable("hangupButton");
});

easyrtc.setOnStreamClosed(function (easyrtcid) {
  easyrtc.setVideoObjectSrc(document.getElementById("callerAudio"), "");
  //disable("hangupButton");
});
easyrtc.setAcceptChecker(function (easyrtcid, callback) {
  console.log("setAcceptChecker", easyrtcid);
  callback(true);
});
