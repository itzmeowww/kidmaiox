let DEBUG = true;

//workbook

var wb = XLSX.utils.book_new();
wb.Props = {
  Title: "PB",

  Author: "6200313@kvis.ac.th",
  CreatedDate: new Date(),
};

function s2ab(s) {
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf); //create uint8array as viewer
  for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff; //convert to octet
  return buf;
}

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
let Ids = [];
let allIds = 0;
firebase.initializeApp(firebaseConfig);
let provider = new firebase.auth.GoogleAuthProvider();
let db = firebase.firestore();
let database = firebase.database();

let theHintList = {};
let theRealName = {};
let pendingLoadRealName = 0;

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
      "\n";
  });

  // console.log(ret);
  $(".output").val(ret);
}
function addToList(displayName, hint, id) {
  //console.log("create", id);

  let theHint = $(".hintContainer:last");
  $(".hintList").append(theHint.clone());
  if (displayName === undefined) displayName = "Not chosen";

  theHint.children(".displayName").text(displayName);
  // theHint.children(".hint").text(hint);
  // theHint.children(".hint2").text(hint2);
  // theHint.children(".email").text(email);
  theHint.children(".hint").text(hint);
  theHint.children(".del-btn").click(function () {
    if (confirm("Delete this hint?")) {
      db.collection("hint")
        .doc(id)
        .get()
        .then((snap) => {
          let uid = snap.data().uid;

          console.log("DEL", uid);
          db.collection("hint")
            .doc("list")
            .get()
            .then((snap) => {
              db.collection("hint")
                .doc(id)
                .delete()
                .then(() => {
                  updateOutput();
                });
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
              if (uid != "") {
                database
                  .ref("users/" + uid + "/")
                  .update({
                    hasHint: false,
                    hintId: "",
                  })
                  .then(() => {
                    console.log("updated", uid);
                  })
                  .catch((err) => {
                    console.log(err);
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
    // $("#updateHint2").val(hint2);
    // $("#updateName").val(name);
  });
  theHint.show();
  theHint.attr("id", id);
  updateOutput();
}
let updateToList = function (displayName, hint, id) {
  theHintList[id] = {
    displayName: displayName,
    hint1: hint,
    id: id,
  };
  pendingLoadRealName++;
  db.collection("secret")
    .doc(id)
    .get()
    .then((snap) => {
      let realName = snap.data().realName;
      theRealName[id] = realName;
      pendingLoadRealName--;
    });
  let theHint = $("#" + id);

  if (displayName === undefined) displayName = "Not chosen";
  else {
    theHint.addClass("hasChosen");
  }
  theHint.children(".displayName").text(displayName);
  // theHint.children(".hint").text(hint);
  // theHint.children(".hint2").text(hint2);
  // theHint.children(".email").text(email);
  theHint.children(".hint").text(hint);
  updateOutput();
};
let showList = function (idList) {
  //console.log(idList);
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
          //console.log(element);
          addToList(
            element.name,

            element.hint,

            id
          );

          docRef.doc(id).onSnapshot(function (data) {
            let element = data.data();

            if (element === undefined) {
              $("#" + id).remove();
              delete theHintList[id];
            } else {
              updateToList(element.name, element.hint, id);
            }
          });
        })
        .catch((err) => {
          console.log("show ", err);
        });
    }
  });
};
let init = function () {
  $("#save-excel").show();
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
let save2excel = function () {
  if (pendingLoadRealName != 0) {
    alert("Try again soon");
    return;
  }
  wb.SheetNames.push("Test Sheet");
  var ws_data = [["เลขรหัสน้อง", "คำใบ้", "", "", "", "ชื่อพี่รหัส"]];
  //write data

  for (id in theHintList) {
    if (theHintList.hasOwnProperty(id)) {
      let displayName = theHintList[id].displayName;
      // let codename = theHintList[id].codename;
      let hint1 = theHintList[id].hint1;
      // let hint2 = theHintList[id].hint2;
      // let email = theHintList[id].email;
      let realName = theRealName[id];
      ws_data.push([displayName, hint1, "", "", "", realName]);
    }
  }

  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  wb.Sheets["Test Sheet"] = ws;
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  saveAs(
    new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    "pb.xlsx"
  );
};

let handleSubmit = function () {
  var docRef = db.collection("hint");
  docRef
    .doc("list")
    .get()
    .then(function (snapshot) {
      //console.log(snapshot.data());
      let all_id = snapshot.data().all_id || [];
      let id = snapshot.data().id || [];
      // showList(all_id);
      let hint = $("#myHint").val();
      let name = $("#myRealName").val();
      if (hint === "") {
        alert("Hint can not be empty");
      } else if (name === "") {
        alert("Name can not be empty");
      } else {
        $("#myHint").val("");
        $("#myRealName").val("");

        docRef
          .add({
            hasChosen: false,
            hint: hint,
          })
          .then(function (snap) {
            all_id.push(snap.id);

            db.collection("secret").doc(snap.id).set({
              realName: name,
            });

            id.push(snap.id);

            docRef.doc("list").update({
              all_id: all_id,
              id: id,
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
};

let handleUpdate = function () {
  $(".updateForm").hide();
  let hint = $("#updateHint").val();
  let id = $(".updateForm").attr("target");
  let theHint = $("#" + id);
  theHint.children(".update-btn").click(function () {
    $(".updateForm").show();
    $(".updateForm").attr("target", id);
    $("#updateHint").val(hint);
  });

  //console.log(hint, name, id);
  db.collection("hint").doc(id).update({
    hint: hint,
  });
};
$(document).ready(function () {
  $(".closeUpdateForm").click(function () {
    $(".updateForm").hide();
  });

  $("#save-excel").click(function () {
    save2excel();
  });
  $(".hintForm").submit(function (e) {
    handleSubmit();
    e.preventDefault();
  });

  $(".updateForm").submit(function (e) {
    handleUpdate();
    e.preventDefault();
  });

  $(".hintList").hide();
  $(".signIn-btn").click(function () {
    firebase.auth().signInWithRedirect(provider);
  });
});
