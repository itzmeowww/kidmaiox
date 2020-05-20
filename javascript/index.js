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
    hint2Id: "",
  });
}

function setUserHint(uid, hintId) {
  let updates = {};
  updates["users/" + uid + "/hintId"] = hintId;
  updates["users/" + uid + "/hasHint"] = true;
  database.ref().update(updates);
}
function setUserHint2(uid, hint2Id) {
  let updates = {};
  updates["users/" + uid + "/hint2Id"] = hint2Id;
  updates["users/" + uid + "/hasHint2"] = true;
  database.ref().update(updates);
}

function getHintId(hintId) {
  $("#hint-btn").text("Pairing");
  let id;
  id = hintId[Math.floor(Math.random() * hintId.length)];
  $("#hint-btn").hide();
  return id;
}

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
      console.log("showHint : myHint", myHint);
      $(".hint").text(myHint.hint);
      $(".codename").text("- " + myHint.codename + " -");
    })
    .catch((err) => {
      console.log("From showHint", err);
    });
  $(".hint").show();
}

function ready() {
  $(".hint").hide();
  $("#hint-btn").show();
  $("#hint-btn").click(function () {
    $("#hint-btn").text("Pairing");
    var docRef = db.collection("hint").doc("list");
    docRef
      .get()
      .then(function (snapshot) {
        let hintId = snapshot.data().id;
        let myId = getHintId(hintId);
        console.log("Your Id ", myId);
        const index = hintId.indexOf(myId);
        if (index > -1) {
          hintId.splice(index, 1);
        }
        let updates = {};
        updates["id"] = hintId;
        docRef.update(updates);
        $(".brew-pot-container").show();
        setUserHint(firebase.auth().currentUser.uid, myId);
        setTimeout(() => {
          $(".brew-pot-container").hide();
        }, 5000);

        showHint(myId);

        db.collection("hint").doc(myId).update({
          email: firebase.auth().currentUser.email,
          hasChosen: true,
        });
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  });
}
function init() {
  $(".intro").hide();
  $(".name-text").show();
  $(".title").show();
  $(".desc").show();
  let user = firebase.auth().currentUser;
  $(".name").text(user.displayName);
  console.log(user);
  firebase
    .database()
    .ref("/users/" + user.uid)
    .once("value")
    .then(function (snapshot) {
      console.log(snapshot.val());
      var email = snapshot.val() && snapshot.val().email;
      if (email === null) {
        createUser(user.uid, user.displayName, user.email);
        ready();
      } else {
        if (snapshot.val().hasHint) {
          showHint(snapshot.val().hintId);
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

firebase
  .auth()
  .getRedirectResult()
  .then(function (result) {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // ...
    }
    // The signed-in user info.
    var user = result.user;
    if (user) {
      let email = user.email;
      $(".signIn-btn").hide();
      if (
        email.split("@")[1] === "mail.kmutt.ac.th" ||
        (DEBUG && email.split("@")[1] === "promma.ac.th")
      ) {
        init();
      } else {
        $(".signIn-btn").show();
        $(".signIn-btn").text("Click Me Now");
        alert("Please use email with @mail.kmutt.ac.th");
      }
    } else {
      $(".signIn-btn").text("Click Me Now");
    }
  })
  .catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
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
