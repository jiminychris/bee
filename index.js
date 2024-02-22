import * as firebaseApp from "firebase/app";
import * as firestore from "firebase/firestore";
import * as firebaseAuth from "firebase/auth";
import * as firebaseui from "firebaseui";

const app = firebaseApp.initializeApp({
    apiKey: "AIzaSyBirSOcr67gbdgu98fmYbmaTBjHfiAOVAY",
    authDomain: "bees-81069.firebaseapp.com",
    projectId: "bees-81069",
    storageBucket: "bees-81069.appspot.com",
    messagingSenderId: "532329583262",
    appId: "1:532329583262:web:31351dcfd896638756a18f",
    measurementId: "G-1SL4WMSGSJ",
});

const FIREBASE_AUTH_CONTAINER_ID = "firebaseui-auth-container";

const auth = firebaseAuth.initializeAuth(app, {
    persistence: [firebaseAuth.indexedDBLocalPersistence, firebaseAuth.browserLocalPersistence],
});
const db = firestore.getFirestore(app);

var ui = new firebaseui.auth.AuthUI(auth);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
(async function() {
    const listLoader = document.getElementById("list-loader");
    const audio = document.getElementById("audio");
    const dialog = document.getElementById("dialog");
    const lists = document.getElementById("lists");
    const attract = document.getElementById("attract");
    const play = document.getElementById("play");
    const buttonUpload = document.getElementById("upload");
    const textbox = document.getElementById("textbox");
    const submit = document.getElementById("submit");
    const repeat = document.getElementById("repeat");
    const define = document.getElementById("define");
    const refine = document.getElementById("refine");
    const restart = document.getElementById("restart");
    const buttonQuit = document.getElementById("quit");
    const scoreboard = document.getElementById("scoreboard");
    const progress = document.getElementById("progress");
    const dialog_name = document.getElementById("dialog_name");
    const dialog_words = document.getElementById("dialog_words");
    const signout = document.getElementById("signout");
    const signin = document.getElementById("signin");
    const signedout = document.getElementById("signedout");
    const signedin = document.getElementById("signedin");
    const email = document.getElementById("email");
    const firebaseAuthContainer = document.getElementById(FIREBASE_AUTH_CONTAINER_ID);

    function loginUiStart() {
        ui.start(`#${FIREBASE_AUTH_CONTAINER_ID}`, {
            signInOptions: [
                {
                    provider: firebaseAuth.EmailAuthProvider.PROVIDER_ID,
                    requireDisplayName: false,
                    signInMethod: firebaseAuth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
                },
                {
                    provider: firebaseAuth.GoogleAuthProvider.PROVIDER_ID,
                    requireDisplayName: false,
                }
            ],
        });
    }

    function login() {
        firebaseAuthContainer.showModal();
        loginUiStart();
    }

    function updateScoreboard(value, clazz) {
        var li = document.createElement("li");
        if (clazz !== undefined) li.classList.add(clazz);
        li.append(document.createTextNode(value));
        scoreboard.prepend(li);
    }
    
    function chooseList(l) {
        wordList = l;
        words = l.words;
        attract.hidden = true;
        play.hidden = false;
        initialize();
    }

    function parseWords(x) {
        return x.split("\n").filter(w => w.trim().length > 0);
    }

    function quit() {
        play.hidden = true;
        attract.hidden = false;
    }

    function createButton(value, action) {
        const button = document.createElement("input");
        button.type = "button"
        button.value = value;
        button.onclick = action;
        return button;
    }

    function createSelectButton(wordList) {
        return createButton("Select", () => chooseList(wordList));
    }

    function createWordListEntry(wordList, additionalButtons = []) {
        const block = document.createElement("div");
        const listName = document.createTextNode(wordList.name);
        const buttons = [createSelectButton(wordList)].concat(additionalButtons);
        buttons.forEach(button => block.appendChild(button));
        block.appendChild(listName);
        lists.appendChild(block);
        return block;
    }

    async function refreshWordLists() {
        lists.innerHTML = "";
        listLoader.hidden = false;
        const querySnapshot = await firestore.getDocs(firestore.collection(db, "lists"));
        querySnapshot.forEach(list => {
            createWordListEntry(list.data());
        });
        listLoader.hidden = true;
    }

    textbox.onkeydown = function(event) {
        if (event.keyCode == 13) submit.click();
    };

    var score, index, r, spellings, word, randomizer, incorrectWords, words, wordList;

    function say(phrase) {
        window.speechSynthesis.cancel();
        audio.pause();
        audio.currentTime = 0;
        textbox.focus();
        audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(phrase)}`;
        audio.play().catch(() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase)));
    }

    function sayWord() {
        say(word);
    }

    function defineWord() {
        let definitionText;
        textbox.focus();
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, true);
        xhr.onload = () => {
            if(xhr.readyState === 4) {
                if(xhr.status === 200) {
                    var definitions = [];
                    const parsed = JSON.parse(xhr.responseText);
                    parsed[0]["meanings"].forEach(meaning => {
                        meaning["definitions"].forEach(definition => {
                            definitions.push(definition["definition"])
                        });
                    });
                    if (definitions.length > 1) {
                        definitions.length = Math.min(definitions.length, 2);
                        definitions = definitions.map((d, i) => `${i+1}. ${d}`);
                    }
                    definitionText = definitions.join(" ");
                } else if(xhr.status === 404) {
                    definitionText = "No definition found.";
                } else {
                    definitionText = "Error loading definition.";
                    console.error(xhr.statusText);
                }
            }
            say(definitionText);
        };
        xhr.onerror = () => {
            say("Error loading definition.");
            console.error(xhr.statusText);
        };
        xhr.send(null);
    }

    function advance() {
        const guess = textbox.value;
        if (guess !== "") {
            textbox.value = "";
            if (spellings.some(spelling => guess.toLowerCase() === spelling.toLowerCase())) {
                ++score;
            } else {
                incorrectWords.push(word);
                updateScoreboard(`Incorrect! ${word} (You said "${guess}")`, "incorrect");
            }
            index++;
            if (index < words.length) {
                populate();
            } else {
                updateScoreboard(`Game over. You got ${score} correct.`);
                if (score !== words.length) refine.hidden = false;
                submit.onclick = null;
                repeat.hidden = true;
                define.hidden = true;
            }
        } else {
            say(word);
        }
    }

    function populate() {
        r = randomizer[index];
        spellings = words[r].split("|");
        word = spellings[0];
        progress.innerText = `Progress: ${index + 1} / ${words.length}`;
        say(word);
    }

    function initialize() {
        scoreboard.innerHTML = "";
        index = score = 0;
        incorrectWords = [];
        randomizer = Array.from(Array(words.length).keys());
        shuffleArray(randomizer);
        submit.onclick = advance;
        repeat.hidden = false;
        define.hidden = false;
        refine.hidden = true;
        populate();
        textbox.focus();
    }

    function signOut() {
        auth.signOut();
    }

    function reset() {
        words = wordList.words;
        initialize();
    }

    function refinedReset() {
        words = incorrectWords;
        initialize();
    }

    async function handleDialogAddClose(e) {
        if (dialog.returnValue !== "cancel") {
            const newList = {
                owner: e.currentTarget.user.uid,
                name: dialog_name.value,
                words: parseWords(dialog_words.value),
            };
            await firestore.addDoc(firestore.collection(db, "lists"), newList);
            refreshWordLists();
        }
        dialog_name.value = "";
        dialog_words.value = "";
        dialog.removeEventListener("close", handleDialogAddClose);
    }

    function upload() {
        const user = auth.currentUser;
        if (user) {
            dialog.user = user;
            dialog.addEventListener("close", handleDialogAddClose);
            dialog.showModal();
        } else {
            login();
        }
    }

    async function onAuthStateChanged(user) {
        const signedIn = !!user;
        const pendingRedirect = ui.isPendingRedirect();
        
        signedout.hidden = signedIn || pendingRedirect
        signedin.hidden = !signedIn;
        
        if (signedIn) {
            email.textContent = user.email;
        }
        if (ui.isPendingRedirect()) {
            loginUiStart();
        }
    }

    signin.onclick = login;
    signout.onclick = signOut;
    restart.onclick = reset;
    refine.onclick = refinedReset;
    repeat.onclick = sayWord;
    define.onclick = defineWord;
    buttonUpload.onclick = upload;
    buttonQuit.onclick = quit;

    if (firebaseAuth.isSignInWithEmailLink(auth, window.location.href)) {
        const email = window.prompt("Please provide your email for confirmation");
        await firebaseAuth.signInWithEmailLink(auth, email, window.location.href);
        window.history.replaceState(null, "", window.location.pathname);
    }

    firebaseAuth.onAuthStateChanged(auth, onAuthStateChanged, error => {
        console.error(error);
    });

    refreshWordLists();
})();
