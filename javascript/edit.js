let DEBUG = true;
// Your web app's Firebase configuration
let firebaseConfig = {
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
let Ids = [];
let allIds = 0;
firebase.initializeApp(firebaseConfig);
let provider = new firebase.auth.GoogleAuthProvider();
let db = firebase.firestore();
let database = firebase.database();

function updateOutput() {
  let ret = "";
  $(".hintContainer").each(function () {
    ret +=
      $(this).find(".name").text() +
      " " +
      $(this).find(".hint").text() +
      " " +
      $(this).find(".hint2").text() +
      " " +
      $(this).find(".email").text() +
      " " +
      $(this).find(".email2").text() +
      "\n";
  });

  // console.log(ret);
  $(".output").val(ret);
}
function addToList(name, hint, hint2, email, email2, id) {
  console.log("create", id);
  let theHint = $(".hintContainer:last");
  $(".hintList").append(theHint.clone());
  theHint.children(".hint").text(hint);
  theHint.children(".hint2").text(hint2);
  theHint.children(".email").text(email);
  theHint.children(".email2").text(email2);
  theHint.children(".name").text(name);
  theHint.children(".del-btn").click(function () {
    if (confirm("Delete this hint?")) {
      updateOutput();
      db.collection("hint")
        .doc(id)
        .get()
        .then((snap) => {
          let uid = snap.data().uid;
          let uid2 = snap.data().uid2;
          db.collection("hint")
            .doc("list")
            .get()
            .then((snap) => {
              db.collection("hint").doc(id).delete();
              let idList = snap.data().id;
              let idList2 = snap.data().id2;
              let all_id = snap.data().all_id;
              let index = idList.indexOf(id);

              if (index > -1) {
                idList.splice(index, 1);
              }
              index = idList2.indexOf(id);
              if (index > -1) {
                idList2.splice(index, 1);
              }
              index = all_id.indexOf(id);
              if (index > -1) {
                all_id.splice(index, 1);
              }

              db.collection("hint").doc("list").update({
                id: idList,
                id2: idList2,
                all_id: all_id,
              });
              if (uid != "") {
                database.ref("users/" + uid + "/").update({
                  hasHint: false,
                  hasHint2: false,
                  hintId: "",
                  pickHint2: false,
                });
              }

              if (uid2 != "") {
                database.ref("users/" + uid2 + "/").update({
                  hasHint: false,
                  hasHint2: false,
                  hintId: "",
                  pickHint2: false,
                });
              }
            });
        });
    }
  });
  theHint.children(".update-btn").click(function () {
    $(".updateForm").show();
    $(".updateForm").attr("target", id);
    $("#updateHint").val(hint);
    $("#updateHint2").val(hint2);
    $("#updateName").val(name);
  });
  theHint.show();
  theHint.attr("id", id);
  updateOutput();
}
let updateToList = function (name, hint, hint2, email, email2, id) {
  let theHint = $("#" + id);
  theHint.children(".hint").text(hint);
  theHint.children(".hint2").text(hint2);
  theHint.children(".email").text(email);
  theHint.children(".email2").text(email2);
  theHint.children(".name").text(name);
  updateOutput();
};
let showList = function (idList) {
  console.log(idList);
  let theHint = $(".hintContainer:last").clone();
  $(".hintList").empty();
  $(".hintList").append(theHint);

  $(".hintCount").text(idList.length);
  var docRef = db.collection("hint");
  idList.forEach((id) => {
    if (id != "") {
      docRef
        .doc(id)
        .get()
        .then((snap) => {
          let element = snap.data();
          console.log(element);
          addToList(
            element.codename,
            element.hint,
            element.hint2,
            element.email,
            element.email2,
            id
          );
          docRef.doc(id).onSnapshot(function (data) {
            let element = data.data();
            console.log(element);
            updateToList(
              element.codename,
              element.hint,
              element.hint2,
              element.email,
              element.email2,
              id
            );
          });
        })
        .catch((err) => {
          console.log("show ", err);
        });
    }
  });
};
let init = function () {
  var docRef = db.collection("hint");
  var keyRef = db.collection("secret").doc("keys");

  keyRef
    .get()
    .then((snap) => {
      docRef.doc("list").onSnapshot(function (doc) {
        //console.log("Change!");
        showList(doc.data().all_id);
      });
      $(".output").show();
      docRef
        .doc("list")
        .get()
        .then(function (snapshot) {
          // console.log(snapshot.data());
          let all_id = snapshot.data().all_id;
          let id = snapshot.data().id;
          // showList(all_id);
          $(".hintForm").show();
        })
        .catch(function (error) {
          alert("Sorry, you do not have permission");
        });
    })
    .catch((err) => {
      alert("Sorry, You can not access this section");
    });
};
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
firebase.auth().onAuthStateChanged((user) => {
  lastAuth(user);
});
let lastAuth = function (user) {
  if (user) {
    $(".signIn-btn").hide();
    $(".hintList").show();
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
    $(".signIn-btn").text("Sign Me In");
  }
};
firebase
  .auth()
  .getRedirectResult()
  .then(function (result) {})
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
  $(".closeUpdateForm").click(function () {
    $(".updateForm").hide();
  });
  $(".submitUpdateHintForm").click(function () {
    $(".updateForm").hide();
    let hint = $("#updateHint").val();
    let hint2 = $("#updateHint2").val();
    let name = $("#updateName").val();
    let id = $(".updateForm").attr("target");
    let theHint = $("#" + id);
    theHint.children(".update-btn").click(function () {
      $(".updateForm").show();
      $(".updateForm").attr("target", id);
      $("#updateHint").val(hint);
      $("#updateHint2").val(hint2);
      $("#updateName").val(name);
    });

    //console.log(hint, name, id);
    db.collection("hint").doc(id).update({
      hint: hint,
      hint2: hint2,
      codename: name,
    });
  });
  $(".hintList").hide();
  $(".signIn-btn").click(function () {
    firebase.auth().signInWithRedirect(provider);
  });

  $(".submitHintForm").click(function () {
    var docRef = db.collection("hint");
    docRef
      .doc("list")
      .get()
      .then(function (snapshot) {
        console.log(snapshot.data());
        let all_id = snapshot.data().all_id;
        let id = snapshot.data().id;
        let id2 = snapshot.data().id2 || [];
        // showList(all_id);
        let two = $("#two").prop("checked");
        let hint = $("#myHint").val();
        let hint2 = $("#myHint2").val();
        let codename = $("#myName").val();
        if (hint === "" || hint2 === "") {
          alert("Hint can not be empty");
        } else {
          docRef
            .add({
              codename: codename,
              email: "",
              email2: "",
              hasChosen: false,
              hint: hint,
              hint2: hint2,
            })
            .then(function (snap) {
              all_id.push(snap.id);
              id.push(snap.id);
              if (two == true) id2.push(snap.id);

              docRef.doc("list").update({
                all_id: all_id,
                id: id,
                id2: id2,
              });
            })
            .catch((err) => console.log(err));
        }
        $(".hintForm").show();
      })
      .catch(function (error) {
        alert("Sorry, you do not have permission");
        console.log("Error getting document:", error);
      });
  });
});
