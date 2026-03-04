import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- FIREBASE KONFIGURATSIYASI ---
const firebaseConfig = {
  apiKey: "AIzaSyBijn4YAYVsEaTTDqJhhlZ7i8R4HnK0vlM",
  authDomain: "test-course-cdde6.firebaseapp.com",
  projectId: "test-course-cdde6",
  storageBucket: "test-course-cdde6.firebasestorage.app",
  messagingSenderId: "558737934912",
  appId: "1:558737934912:web:96bef39662f3325d3aeda5",
  measurementId: "G-H8ZVHFFH5G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// HTML elementlarini tanib olish
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const appSection = document.getElementById("appSection");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");

let currentView = 'my'; // 'my' - mening rejalarim, 'public' - ommaviy devor

// --- AUTH (KIRISH-CHIQISH) TIZIMI ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.style.display = "none";
        userInfo.style.display = "flex";
        appSection.style.display = "block";
        document.getElementById("userName").innerText = user.displayName;
        document.getElementById("userImg").src = user.photoURL;
        loadTasks(user.uid);
    } else {
        loginBtn.style.display = "block";
        userInfo.style.display = "none";
        appSection.style.display = "none";
        taskList.innerHTML = "";
    }
});

loginBtn.onclick = () => signInWithPopup(auth, provider).catch(err => alert("Xato: " + err.message));
logoutBtn.onclick = () => signOut(auth);

// --- REJA QO'SHISH ---
addBtn.onclick = async () => {
    const text = taskInput.value;
    const deadline = document.getElementById("taskDeadline")?.value || "";
    const priority = document.getElementById("taskPriority")?.value || "medium";
    const visibility = document.getElementById("taskVisibility")?.value || "private";

    if (text.trim() !== "" && auth.currentUser) {
        try {
            await addDoc(collection(db, "tasks"), {
                text: text,
                deadline: deadline,
                priority: priority,
                visibility: visibility, 
                uid: auth.currentUser.uid,
                userName: auth.currentUser.displayName,
                completed: false,
                createdAt: serverTimestamp()
            });
            taskInput.value = "";
        } catch (e) {
            console.error("Xato yuz berdi: ", e);
        }
    } else {
        alert("Reja mazmunini kiriting!");
    }
};

// --- REJALARNI BAZADAN YUKLASH ---
function loadTasks(uid) {
// main.js faylidagi loadTasks funksiyasini shu qismini almashtiring:
if (currentView === 'my') {
    q = query(collection(db, "tasks"), where("uid", "==", uid), orderBy("createdAt", "desc"));
} else {
    // Ommaviy devor uchun saralashni indeksingizga moslab 'desc'siz yozamiz
    q = query(collection(db, "tasks"), where("visibility", "==", "public"), orderBy("createdAt"));
}
}

// --- GLOBAL FUNKSIYALAR (HTML DAN CHAQIRILADI) ---
window.changeView = (view) => {
    currentView = view;
    // Faol tugmani belgilash
    document.getElementById("myTasksTab")?.classList.toggle("active", view === 'my');
    document.getElementById("publicTasksTab")?.classList.toggle("active", view === 'public');
    
    if (auth.currentUser) loadTasks(auth.currentUser.uid);
};

window.deleteTask = (id) => confirm("O'chirasizmi?") && deleteDoc(doc(db, "tasks", id));
window.toggleTask = (id, status) => updateDoc(doc(db, "tasks", id), { completed: !status });

// --- SMART ALARM (ESLATMA) ---
setInterval(() => {
    const hozir = new Date();
    document.querySelectorAll('.task-item:not(.completed)').forEach(item => {
        const timeEl = item.querySelector('.task-time');
        if (timeEl && timeEl.innerText !== "") {
            const cleanTime = timeEl.innerText.replace('⏰ ', '').replace(' ', 'T');
            const taskDate = new Date(cleanTime);
            
            // Vaqti kelsa signal chalish (30 soniya ichida)
            if (taskDate <= hozir && taskDate > new Date(hozir - 30000)) { 
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play();
                alert("ESLATMA: " + item.querySelector('.task-text').innerText);
            }
        }
    });
}, 30000); // Har 30 soniyada tekshiradi