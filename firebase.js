// firebase.js — تهيئة Firebase ودوال مشتركة للمصادقة وقاعدة البيانات
// تُستخدم بنفس الشكل في المواقع الثلاثة (الرئيسية / لوحة التحكم / الملاك)
// لأنها كلها منشورة تحت نفس نطاق GitHub Pages.

import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBu5LBvZnSLGq3eIg6KcRL3OeWXpdIudPY",
  authDomain: "aqari-realestate.firebaseapp.com",
  projectId: "aqari-realestate",
  storageBucket: "aqari-realestate.firebasestorage.app",
  messagingSenderId: "964671928046",
  appId: "1:964671928046:web:c854f72ce839bff14c25ff",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// حسابات الملاك تسجّل دخول باسم مستخدم بدل إيميل، فنحوّل اسم المستخدم
// إلى إيميل وهمي داخليًا (Firebase Auth يحتاج إيميل دائمًا).
const OWNER_EMAIL_DOMAIN = "aqari-owners.local";
export function usernameToEmail(username) {
  const clean = (username || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return clean + "@" + OWNER_EMAIL_DOMAIN;
}

// ---------------- مصادقة ----------------
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginOwner(username, password) {
  return signInWithEmailAndPassword(auth, usernameToEmail(username), password);
}

export async function logout() {
  return signOut(auth);
}

export async function checkIsAdmin(uid) {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}

// ينشئ حساب مالك جديد من لوحة تحكم الإدارة، بدون ما يفصل جلسة دخول الإدارة
// الحالية (نستخدم نسخة ثانية مؤقتة من تطبيق Firebase لهذا الغرض).
export async function createOwnerAccount({ name, phone, email, username, password }) {
  const secondaryApp = initializeApp(firebaseConfig, "secondary-" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, usernameToEmail(username), password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    await setDoc(doc(db, "owners", uid), {
      name,
      phone,
      email: email || "",
      username: (username || "").trim().toLowerCase(),
      createdAt: Date.now(),
    });
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

// ---------------- بيانات: العقارات ----------------
export async function getProperties() {
  const snap = await getDocs(query(collection(db, "properties"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addProperty(data) {
  const id = "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await setDoc(doc(db, "properties", id), { ...data, createdAt: Date.now() });
  return id;
}

export async function updateProperty(id, data) {
  await updateDoc(doc(db, "properties", id), data);
}

export async function deleteProperty(id) {
  await deleteDoc(doc(db, "properties", id));
}

// ---------------- بيانات: الملاك ----------------
export async function getOwners() {
  const snap = await getDocs(query(collection(db, "owners"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOwner(uid) {
  const snap = await getDoc(doc(db, "owners", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
