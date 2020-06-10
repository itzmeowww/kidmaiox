let DEBUG = true;

//workbook

var wb = XLSX.utils.book_new();
wb.Props = {
  Title: "ESC x KOSEN",

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

let theHintList = {};
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
function addToList(displayName, name, hint, hint2, email, id) {
  //console.log("create", id);

  let theHint = $(".hintContainer:last");
  $(".hintList").append(theHint.clone());
  if (displayName === undefined) displayName = "Not chosen";

  theHint.children(".displayName").text(displayName);
  // theHint.children(".hint").text(hint);
  // theHint.children(".hint2").text(hint2);
  // theHint.children(".email").text(email);
  theHint.children(".name").text(name);
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
                database
                  .ref("users/" + uid + "/")
                  .update({
                    hasHint: false,
                    hasHint2: false,
                    hintId: "",
                    pickHint2: false,
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
    $("#updateHint2").val(hint2);
    $("#updateName").val(name);
  });
  theHint.show();
  theHint.attr("id", id);
  updateOutput();
}
let updateToList = function (displayName, name, hint, hint2, email, id) {
  theHintList[id] = {
    displayName: displayName,
    codename: name,
    hint1: hint,
    hint2: hint2,
    email: email,
    id: id,
  };

  let theHint = $("#" + id);

  if (displayName === undefined) displayName = "Not chosen";
  else {
    theHint.addClass("hasChosen");
  }
  theHint.children(".displayName").text(displayName);
  // theHint.children(".hint").text(hint);
  // theHint.children(".hint2").text(hint2);
  // theHint.children(".email").text(email);
  theHint.children(".name").text(name);
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
            element.codename,
            element.hint,
            element.hint2,
            element.email,
            id
          );

          docRef.doc(id).onSnapshot(function (data) {
            let element = data.data();

            if (element === undefined) {
              $("#" + id).remove();
              delete theHintList[id];
            } else {
              updateToList(
                element.name,
                element.codename,
                element.hint,
                element.hint2,
                element.email,
                id
              );
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
  wb.SheetNames.push("Test Sheet");
  var ws_data = [["ชื่อ", "ชื่อสาย", "คำใบ้ 1", "คำใบ้ 2", "email"]];
  //write data

  for (id in theHintList) {
    if (theHintList.hasOwnProperty(id)) {
      let displayName = theHintList[id].displayName;
      let codename = theHintList[id].codename;
      let hint1 = theHintList[id].hint1;
      let hint2 = theHintList[id].hint2;
      let email = theHintList[id].email;
      ws_data.push([displayName, codename, hint1, hint2, email]);
    }
  }

  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  wb.Sheets["Test Sheet"] = ws;
  var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  saveAs(
    new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    "escnkosen.xlsx"
  );
};

let handleSubmit = function () {
  var docRef = db.collection("hint");
  docRef
    .doc("list")
    .get()
    .then(function (snapshot) {
      //console.log(snapshot.data());
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
        $("#myHint").val("");
        $("#myHint2").val("");
        $("#myName").val("");

        docRef
          .add({
            codename: codename,
            email: "",
            hasChosen: false,
            hint: hint,
            hint2: hint2,
          })
          .then(function (snap) {
            all_id.push(snap.id);

            if (two == true) id2.push(snap.id);
            else {
              id.push(snap.id);
            }

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
};

let handleUpdate = function () {
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
