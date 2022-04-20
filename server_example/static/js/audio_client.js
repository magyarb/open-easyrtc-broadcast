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
var maxCALLERS = 200;

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
  easyrtc.setRoomOccupantListener(callEverybodyElse);
  easyrtc.initMediaSource(
    function () {
      // success callback
      easyrtc.connect("easyrtc.audioOnly", loginSuccess, loginFailure);
    },
    function (errorCode, errmesg) {
      easyrtc.showError(errorCode, errmesg);
    } // failure callback
  );
}

function terminatePage() {
  easyrtc.disconnect();
}

function hangup() {
  easyrtc.hangupAll();
  //disable("hangupButton");
}

function callEverybodyElse(roomName, otherPeople) {
  easyrtc.setRoomOccupantListener(null); // so we're only called once.

  var list = [];
  var connectCount = 0;
  for (var easyrtcid in otherPeople) {
    list.push(easyrtcid);
  }
  //
  // Connect in reverse order. Latter arriving people are more likely to have
  // empty slots.
  //
  function establishConnection(position) {
    function callSuccess() {
      connectCount++;
      if (connectCount < maxCALLERS && position > 0) {
        establishConnection(position - 1);
      }
    }
    function callFailure(errorCode, errorText) {
      easyrtc.showError(errorCode, errorText);
      if (connectCount < maxCALLERS && position > 0) {
        establishConnection(position - 1);
      }
    }
    easyrtc.call(list[position], callSuccess, callFailure);
  }
  if (list.length > 0) {
    establishConnection(list.length - 1);
  }
}

function clearConnectList() {
  otherClientDiv = document.getElementById("otherClients");
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }
}

function convertListToButtons(roomName, occupants, isPrimary) {
  clearConnectList();
  var otherClientDiv = document.getElementById("otherClients");
  for (var easyrtcid in occupants) {
    var button = document.createElement("button");
    button.onclick = (function (easyrtcid) {
      return function () {
        performCall(easyrtcid);
      };
    })(easyrtcid);

    var label = document.createElement("text");
    label.innerHTML = easyrtc.idToName(easyrtcid);
    button.appendChild(label);
    otherClientDiv.appendChild(button);
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
      //enable("otherClients");
    }
  };
  var successCB = function () {
    //enable("hangupButton");
  };
  var failureCB = function () {
    //enable("otherClients");
  };
  easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
}

function loginSuccess(easyrtcid, roomOwner) {
  console.log("loginSuccess", easyrtcid, roomOwner);
  //disable("connectButton");
  // enable("disconnectButton");
  //enable("otherClients");
  selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "Connected";
}

function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}

function disconnect() {
  document.getElementById("iam").innerHTML = "logged out";
  easyrtc.disconnect();
  console.log("disconnecting from server");
  //enable("connectButton");
  // disable("disconnectButton");
  clearConnectList();
}

easyrtc.setStreamAcceptor(function (easyrtcid, stream) {
  var audio = document.getElementById("callerAudio");
  easyrtc.setVideoObjectSrc(audio, stream);
  //enable("hangupButton");
});

easyrtc.setOnStreamClosed(function (easyrtcid) {
  easyrtc.setVideoObjectSrc(document.getElementById("callerAudio"), "");
  //disable("hangupButton");
});
easyrtc.setAcceptChecker(function (easyrtcid, callback) {
  console.log("declining call from " + easyrtcid);
  callback(false);
});
