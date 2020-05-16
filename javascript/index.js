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

function init() {
  let user = firebase.auth().currentUser;

  $(".name").text(user.displayName);
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
      if (
        email.split("@")[1] === "mail.kmutt.ac.th" ||
        (DEBUG && email.split("@")[1] === "promma.ac.th")
      ) {
        init();
      } else {
        firebase.auth().signInWithRedirect(provider);
      }
    } else {
      firebase.auth().signInWithRedirect(provider);
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
