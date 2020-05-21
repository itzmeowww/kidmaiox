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
let Ids = [];
let allIds = 0;
firebase.initializeApp(firebaseConfig);
var provider = new firebase.auth.GoogleAuthProvider();
var db = firebase.firestore();

function updateOutput() {
  let ret = "";
  $(".hintContainer").each(function () {
    ret +=
      $(this).find(".name").text() +
      " " +
      $(this).find(".hint").text() +
      " " +
      $(this).find(".email").text() +
      "\n";
  });

  // console.log(ret);
  $(".output").val(ret);
}
function addToList(name, hint, email, id) {
  console.log("create", id);
  let theHint = $(".hintContainer:last");
  $(".hintList").append(theHint.clone());
  theHint.children(".hint").text(hint);
  theHint.children(".email").text(email);
  theHint.children(".name").text(name);
  theHint.children(".del-btn").click(function () {
    if (confirm("Delete this hint?")) {
      db.collection("hint").doc(id).delete();
      db.collection("hint")
        .doc("list")
        .get()
        .then((snap) => {
          let idList = snap.data().id;
          let all_id = snap.data().all_id;
          let index = idList.indexOf(id);
          if (index > -1) {
            idList.splice(index, 1);
          }
          index = all_id.indexOf(id);
          if (index > -1) {
            all_id.splice(index, 1);
          }
          db.collection("hint").doc("list").update({
            id: idList,
            all_id: all_id,
          });
        });
      //TODO reset user that has this hint
    }
  });
  theHint.children(".update-btn").click(function () {
    $(".updateForm").show();
    $(".updateForm").attr("target", id);
    $("#updateHint").val(hint);
    $("#updateName").val(name);
  });
  theHint.show();
  theHint.attr("id", id);
  updateOutput();
}
function updateToList(name, hint, email, id) {
  let theHint = $("#" + id);
  theHint.children(".hint").text(hint);
  theHint.children(".email").text(email);
  theHint.children(".name").text(name);
  updateOutput();
}
function showList(idList) {
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
          addToList(element.codename, element.hint, element.email, id);
          docRef.doc(id).onSnapshot(function (data) {
            let element = data.data();
            console.log(element);
            updateToList(element.codename, element.hint, element.email, id);
          });
        })
        .catch((err) => {
          console.log("show ", err);
        });
    }
  });
}
function init() {
  var docRef = db.collection("hint");
  var keyRef = db.collection("secret").doc("keys");

  keyRef
    .get()
    .then((snap) => {
      docRef.doc("list").onSnapshot(function (doc) {
        console.log("Change!");
        showList(doc.data().all_id);
      });
      $(".output").show();
      docRef
        .doc("list")
        .get()
        .then(function (snapshot) {
          console.log(snapshot.data());
          let all_id = snapshot.data().all_id;
          let id = snapshot.data().id;
          // showList(all_id);
          $(".hintForm").show();
          $(".submitHintForm").click(function () {
            let hint = $("#myHint").val();
            let codename = $("#myName").val();
            if (hint === "") {
              alert("Hint can not be empty");
            } else {
              docRef
                .add({
                  codename: codename,
                  email: "",
                  hasChosen: false,
                  hint: hint,
                })
                .then(function (snap) {
                  all_id.push(snap.id);
                  id.push(snap.id);
                  docRef.doc("list").update({
                    all_id: all_id,
                    id: id,
                  });
                })
                .catch((err) => console.log(err));
            }
          });
        })
        .catch(function (error) {
          alert("Sorry, you do not have permission");
          console.log("Error getting document:", error);
        });
    })
    .catch((err) => {
      alert("Sorry, You can not access this section");
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
      $(".signIn-btn").hide();
      $(".hintList").show();
      init();
    } else {
      $(".signIn-btn").text("Sign Me In");
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
  $(".closeUpdateForm").click(function () {
    $(".updateForm").hide();
  });
  $(".submitUpdateHintForm").click(function () {
    $(".updateForm").hide();
    let hint = $("#updateHint").val();
    let name = $("#updateName").val();
    let id = $(".updateForm").attr("target");
    console.log(hint, name, id);
    db.collection("hint").doc(id).update({
      hint: hint,
      codename: name,
    });
  });
  $(".hintList").hide();
  $(".signIn-btn").click(function () {
    firebase.auth().signInWithRedirect(provider);
  });
});
