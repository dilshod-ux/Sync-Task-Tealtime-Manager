import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Siz taqdim etgan haqiqiy konfiguratsiya
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

// Elementlarni ushlab olamiz
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const appSection = document.getElementById("appSection");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");

// --- AUTH LOGIC ---
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

// --- ADD TASK ---
addBtn.onclick = async () => {
    const text = taskInput.value;
    const deadline = document.getElementById("taskDeadline")?.value || "";
    const priority = document.getElementById("taskPriority")?.value || "medium";

    if (text.trim() !== "") {
        await addDoc(collection(db, "tasks"), {
            text: text,
            deadline: deadline,
            priority: priority,
            uid: auth.currentUser.uid,
            completed: false,
            createdAt: serverTimestamp()
        });
        taskInput.value = "";
    } else {
        alert("Reja mazmunini kiriting!");
    }
};

// --- LOAD TASKS ---
function loadTasks(uid) {
    const q = query(collection(db, "tasks"), where("uid", "==", uid), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        taskList.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const task = docSnap.data();
            const id = docSnap.id;
            const isComp = task.completed ? "completed" : "";
            
            const li = document.createElement("li");
            li.className = `task-item ${task.priority || 'medium'} ${isComp}`;
            li.innerHTML = `
                <div class="task-info">
                    <b class="task-text">${task.text}</b>
                    <small class="task-time">${task.deadline ? '⏰ ' + task.deadline.replace('T', ' ') : ''}</small>
                </div>
                <div class="actions">
                    <button onclick="toggleTask('${id}', ${task.completed})">✅</button>
                    <button onclick="deleteTask('${id}')">🗑️</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    });
}

// Global funksiyalar
window.deleteTask = (id) => confirm("O'chirasizmi?") && deleteDoc(doc(db, "tasks", id));
window.toggleTask = (id, status) => updateDoc(doc(db, "tasks", id), { completed: !status });

// --- SMART ALARM ---
setInterval(() => {
    const hozir = new Date();
    document.querySelectorAll('.task-item:not(.completed)').forEach(item => {
        const timeEl = item.querySelector('.task-time');
        if (timeEl && timeEl.innerText !== "") {
            const taskDate = new Date(timeEl.innerText.replace('⏰ ', ''));
            if (taskDate <= hozir) {
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
                alert("ESLATMA: " + item.querySelector('.task-text').innerText);
                updateDoc(doc(db, "tasks", item.getAttribute('data-id')), { completed: true });
            }
        }
    });
}, 30000);