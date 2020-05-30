let DEBUG = true;
// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAtjH1QQ6gf6eiTwbhpgPsd6_l3xvEeDjY",
  authDomain: "esccode.firebaseapp.com",
  databaseURL: "https://esccode.firebaseio.com",
  projectId: "esccode",
  storageBucket: "esccode.appspot.com",
  messagingSenderId: "750706636484",
  appId: "1:750706636484:web:196762f26757b90390fb91",
  measurementId: "G-VH6VDYQ4CS",
};
// Initialize Firebase

firebase.initializeApp(firebaseConfig);
var provider = new firebase.auth.GoogleAuthProvider();
var database = firebase.database();
var db = firebase.firestore();

function createUser(uid, username, email) {
  database.ref("users/" + uid).set({
    codename: "",
    username: username,
    email: email,
    hasHint: false,
    hintId: "",
    hasHint2: false,
    pickHint2: false,
  });
}

function setUserHint(uid, hintId) {
  let updates = {};
  updates["users/" + uid + "/hintId"] = hintId;
  updates["users/" + uid + "/hasHint"] = true;

  let luck = Math.round(Math.random() * 10);
  if (luck <= 3) {
    updates["users/" + uid + "/hasHint2"] = true;
  }
  database.ref().update(updates);
}

function getHintId(hintId) {
  if (hintId.length == 0) {
    $("#hint-btn").hide();
    return null;
  }
  $("#hint-btn").text("Pairing");
  let id;
  id = hintId[Math.floor(Math.random() * hintId.length)];
  $("#hint-btn").hide();
  return id;
}
let queueTime = null;
let queueId;

function showHint(id) {
  db.collection("hint")
    .doc(id)
    .onSnapshot(function (doc) {
      let myHint = doc.data();
      $(".hint").text(myHint.hint);
      $(".codename").text("- " + myHint.codename + " -");
    });
  db.collection("hint")
    .doc(id)
    .get()
    .then((snap) => {
      let myHint = snap.data();
      // console.log("showHint : myHint", myHint);
      $(".hint").text(myHint.hint);
      $(".codename").text("- " + myHint.codename + " -");
    })
    .catch((err) => {
      console.log("From showHint", err);
    });
  $(".hint").show();
}

function showHint2(id) {
  db.collection("hint")
    .doc(id)
    .onSnapshot(function (doc) {
      let myHint = doc.data();
      $(".hint2").text(myHint.hint2);
    });
  db.collection("hint")
    .doc(id)
    .get()
    .then((snap) => {
      let myHint = snap.data();
      // console.log("showHint : myHint", myHint);
      $(".hint2").text(myHint.hint2);
    })
    .catch((err) => {
      console.log("From showHint2", err);
    });
  $(".hint2").show();
}
function giveHint() {
  var docRef = db.collection("hint").doc("list");
  let uid = firebase.auth().currentUser.uid;
  firebase
    .database()
    .ref("/users/" + uid)
    .once("value")
    .then(function (snapshot) {
      if (snapshot.val().hasHint) {
        showHint(snapshot.val().hintId);
      } else {
        docRef
          .get()
          .then(function (snapshot) {
            let hintId = snapshot.data().id;
            let myId = getHintId(hintId);
            if (myId == null) {
              try {
                var q = db.collection("queue");
                q.doc(queueId).delete();
              } catch (err) {
                console.log(err);
              }
              alert("Error code 1234 : Please contact admin");
              $(".hint").hide();
              $(".codename").hide();
            } else {
              //console.log("Your Id ", myId);
              const index = hintId.indexOf(myId);
              if (index > -1) {
                hintId.splice(index, 1);
              }
              let updates = {};
              updates["id"] = hintId;
              docRef.update(updates).then(function () {
                var q = db.collection("queue");
                q.doc(queueId).delete();
              });
              $(".brew-pot-container").show();
              setUserHint(firebase.auth().currentUser.uid, myId);
              setTimeout(() => {
                $(".brew-pot-container").hide();
              }, 5000);

              showHint(myId);

              db.collection("hint").doc(myId).update({
                email: firebase.auth().currentUser.email,
                hasChosen: true,
                uid: firebase.auth().currentUser.uid,
              });
            }
          })
          .catch(function (error) {
            console.log("Error getting document:", error);
          });
      }
    });
}

function giveHint2(id, show) {
  $(".brew-pot-container").show();
  database.ref("users/" + firebase.auth().currentUser.uid).update({
    pickHint2: true,
  });
  setTimeout(() => {
    $(".brew-pot-container").hide();
    if (show) showHint2(id);
    else {
      $(".ghost-container").show();
      setTimeout(() => {
        $(".ghost-container").hide();
      }, 3000);
    }
  }, 5000);
}

function addQueue() {
  window.onbeforeunload = function (event) {
    try {
      var q = db.collection("queue");
      q.doc(queueId).delete();
    } catch (err) {
      console.log(err);
    }
  };
  var q = db.collection("queue");
  queueTime = firebase.firestore.FieldValue.serverTimestamp();
  q.add({
    timestamp: queueTime,
  }).then(function (doc) {
    queueId = doc.id;
  });
  q.orderBy("timestamp", "asc").onSnapshot(function (querySnapshot) {
    try {
      // console.log("----------------------");
      // console.log(querySnapshot.docs[0].id);
      // console.log(queueId);
      if (queueId == querySnapshot.docs[0].id) {
        window.onbeforeunload = function (event) {};
        giveHint();
      }
    } catch (err) {
      console.log(err);
    }

    // checkQueue(doc.data());
  });
}

function ready() {
  $(".hint").hide();
  $("#hint-btn").show();
  $("#hint-btn").click(function () {
    $("#hint-btn").text("Pairing");
    if (queueTime == null) addQueue();
  });
}
function init() {
  $(".intro").hide();
  $(".name-text").show();
  $(".title").show();
  $(".desc").show();
  let user = firebase.auth().currentUser;
  $(".name").text(user.displayName);
  //console.log(user);
  firebase
    .database()
    .ref("/users/" + user.uid)
    .once("value")
    .then(function (snapshot) {
      //console.log(snapshot.val());
      var email = snapshot.val() && snapshot.val().email;
      if (email === null) {
        createUser(user.uid, user.displayName, user.email);
        ready();
      } else {
        if (snapshot.val().hasHint) {
          showHint(snapshot.val().hintId);
          if (snapshot.val().pickHint2 == true) {
            if (snapshot.val().hasHint2) showHint2(snapshot.val().hintId);
          } else {
            $("#hint2-btn").show();
            $("#hint2-btn").click(function () {
              $("#hint2-btn").hide();
              giveHint2(snapshot.val().hintId, snapshot.val().hasHint2);
            });
          }
        } else {
          ready();
        }
      }
    })
    .catch((err) => {
      console.log(err);
      alert("Please use email with @mail.kmutt.ac.th");
    });
}

function lastAuth(user) {
  if (user) {
    let email = user.email;
    $(".signIn-btn").hide();
    if (
      email.split("@")[1] === "mail.kmutt.ac.th" ||
      (DEBUG && email.split("@")[1] === "promma.ac.th")
    ) {
      $(".signOut-container").show();
      $(".signOut-btn").click(function () {
        firebase
          .auth()
          .signOut()
          .then(() => {
            // alert("Sign out");
            window.location.reload();
            //firebase.auth().signInWithRedirect(provider);
          });
      });
      init();
    } else {
      $(".signIn-btn").show();
      $(".signIn-btn").text("Click Me Now");
      alert("Please use email with @mail.kmutt.ac.th");
    }
  } else {
    $(".signIn-btn").text("Click Me Now");
  }
}

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
firebase.auth().onAuthStateChanged((user) => {
  lastAuth(user);
});

firebase
  .auth()
  .getRedirectResult()
  .then(function (result) {
    var user = result.user;
    //lastAuth(user);
  })
  .catch(function (error) {
    console.log(error);
  });

$(document).ready(function () {
  $("#hint-btn").hide();
  $(".hint").hide();
  $(".desc").hide();
  $(".title").hide();
  $(".name-text").hide();
  $(".signIn-btn").click(function () {
    $(".signIn-btn").text("Loading...");
    firebase.auth().signInWithRedirect(provider);
  });
});
