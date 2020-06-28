let DEBUG = true;
// Your web app's Firebase configuration
let firebaseConfig = {
  apiKey: "AIzaSyD0QQqsQRrlZ8OeUxNpBWP9lV6gx6aAR4M",
  authDomain: "pb-kidmaiox.firebaseapp.com",
  databaseURL: "https://pb-kidmaiox.firebaseio.com",
  projectId: "pb-kidmaiox",
  storageBucket: "pb-kidmaiox.appspot.com",
  messagingSenderId: "442553110849",
  appId: "1:442553110849:web:509d9827f199768eb811c0",
  measurementId: "G-8MG29024Q1",
};
// Initialize Firebase

firebase.initializeApp(firebaseConfig);
let provider = new firebase.auth.GoogleAuthProvider();
let database = firebase.database();
let db = firebase.firestore();

let createUser = function (uid) {
  console.log(uid);
  database.ref("users/" + uid).set({
    hasHint: false,
    hintId: "",
  });
};

let setUserHint = function (uid, hintId) {
  let updates = {};
  updates["users/" + uid + "/hintId"] = hintId;
  updates["users/" + uid + "/hasHint"] = true;

  database.ref().update(updates);
};

let getHintId = function (hintId) {
  if (hintId.length == 0) {
    $("#hint-btn").hide();
    return null;
  }
  // $("#hint-btn").text("Pairing");
  let id;
  id = hintId[Math.floor(Math.random() * hintId.length)];
  // $("#hint-btn").hide();
  return id;
};

let queueTime = null;
let queueId;

let showHint = function (id) {
  db.collection("hint")
    .doc(id)
    .onSnapshot(function (doc) {
      let myHint = doc.data();
      console.log(myHint);
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

  $(".img-hint").show();
  $(".hint").show();
  $(".img-btn").hide();
};

let giveHint = function (userId) {
  var docRef = db.collection("hint").doc("list");
  let uid = userId;
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
            } else {
              let updates = {};
              const index = hintId.indexOf(myId);
              if (index > -1) {
                hintId.splice(index, 1);
              }
              updates["id"] = hintId;

              docRef.update(updates).then(function () {
                var q = db.collection("queue");
                q.doc(queueId).delete();
              });

              setUserHint(uid, myId);
              setTimeout(() => {}, 5000);

              showHint(myId);
              let updates2 = {};

              updates2["uid"] = uid;
              updates2["name"] = uid;
              updates2["hasChosen"] = true;

              db.collection("hint").doc(myId).update(updates2);
            }
          })
          .catch(function (error) {
            console.log("Error getting document:", error);
          });
      }
    });
};

let addQueue = function (userId) {
  $(".img-btn-hint").addClass("rotate");
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
        giveHint(userId);
      }
    } catch (err) {
      console.log(err);
    }

    // checkQueue(doc.data());
  });
};

let ready = function (userId) {
  $(".hint").hide();
  $(".img-btn").unbind();
  $(".img-btn-hint").show();
  $(".img-btn-hint").click(function () {
    if (queueTime == null) addQueue(userId);
  });
};
let init = function (userId) {
  console.log("init : ", userId);
  firebase
    .database()
    .ref("/users/" + userId)
    .once("value")
    .then(function (snapshot) {
      console.log(snapshot.val());
      var hasHint = snapshot.val() && snapshot.val().hasHint;
      if (hasHint === null) {
        createUser(userId);
        ready(userId);
      } else {
        if (snapshot.val().hasHint) {
          showHint(snapshot.val().hintId);
        } else {
          ready(userId);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

let lastAuth = function (userId) {
  console.log(userId);
  if (userId.length === 5) {
    $(".img-btn").hide();
    init(userId);
  } else {
    alert("Please check your ID");
  }
};

$(document).ready(function () {
  $(".signIn-btn").text("Click Me Now");
  $("#hint-btn").hide();
  $(".hint").hide();
  $(".desc").hide();
  $(".title").hide();
  $(".name-text").hide();
  $(".img-btn").click(() => {
    lastAuth($("#userId").val());
    $(".img-btn").addClass("img-btn-hint");
  });
});
