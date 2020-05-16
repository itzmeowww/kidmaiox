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
    username: username,
    email: email,
    hasHint: false,
    hint: "",
  });
}

function setUserHint(uid, hint, codename) {
  let updates = {};
  updates["users/" + uid + "/hint"] = hint;
  updates["users/" + uid + "/hasHint"] = true;
  updates["users/" + uid + "/codename"] = "- " + codename + " -";
  database.ref().update(updates);
}
function getHint(hints) {
  $("#hint-btn").text("Pairing");
  let hint;
  console.log(hints);
  while (true) {
    hint = hints[Math.floor(Math.random() * hints.length)];
    if (hint.hasChosen == false) {
      $("#hint-btn").hide();
      return hint;
    }
  }
}
function ready() {
  $("#hint-btn").show();
  $("#hint-btn").click(function () {
    var docRef = db.collection("hint");
    docRef
      .get()
      .then(function (snapshot) {
        hints = snapshot.docs.map((doc) => {
          let ret = doc.data();
          ret["doc"] = doc;
          return ret;
        });
        let myHint = getHint(hints);
        $(".hint").text(myHint.hint);
        $(".codename").text(myHint.codename);
        setUserHint(
          firebase.auth().currentUser.uid,
          myHint.hint,
          myHint.codename
        );
        console.log(myHint);
        docRef.doc(myHint.doc.id).update({
          email: firebase.auth().currentUser.email,
          hasChosen: true,
        });
        console.log(myHint);
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  });
}
function init() {
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
          $(".hint").text(snapshot.val().hint);
          $(".codename").text(snapshot.val().codename);
        } else {
          ready();
        }
      }
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
  $(".desc").hide();
  $(".title").hide();
  $(".name-text").hide();
  $(".signIn-btn").click(function () {
    $(".signIn-btn").text("Loading...");
    firebase.auth().signInWithRedirect(provider);
  });
});
