// Firebase SDK Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBDq5Nnfh_ozp4JKoS38UsjzrYNTKW0kjQ",
  authDomain: "pureboon-firebase.firebaseapp.com",
  projectId: "pureboon-firebase",
  storageBucket: "pureboon-firebase.firebasestorage.app",
  messagingSenderId: "287988948151",
  appId: "1:287988948151:web:71629f605937a76b914132",
  measurementId: "G-DSREDR8C8V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Guard
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  const token = await user.getIdTokenResult(true);
  if (token.claims.role !== "admin") {
    location.href = "shop.html";
    return;
  }
  console.log("✅ Admin Logged In:", user.email);
  loadOrders();
  loadProducts();
  loadPayment();
  loadShipping();
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});

// Show Section
window.showSection = (id) => {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

// Orders Section
async function loadOrders() {
  const snap = await getDocs(collection(db, "orders"));
  document.getElementById("totalOrders").textContent = snap.size;

  const ordersTable = document.getElementById("ordersTable");
  ordersTable.innerHTML = "";

  snap.forEach(docSnap => {
    const order = docSnap.data();
    const total = order.payment?.totalAmount ?? order.totalAmount ?? 0;
    ordersTable.innerHTML += `
      <tr>
        <td>${docSnap.id}</td>
        <td>${order.customer?.Email || "-"}</td>
        <td>${order.customer?.name || "-"}</td>
        <td>${order.customer?.phone || "-"}</td>
        <td>${order.customer?.address || "-"}</td>
        <td>฿${total.toLocaleString()}</td>
        <td>${order.payment?.method || "-"}</td>
        <td>${order.payment?.status || "N/A"}</td>
        <td>
          <button onclick="updateOrderStatus('${docSnap.id}','shipped')">🚚 Mark Shipped</button>
        </td>
      </tr>
    `;
  });
}

window.updateOrderStatus = async (id, status) => {
  await updateDoc(doc(db, "orders", id), { "payment.status": status });
  alert(`✅ Order ${id} updated to ${status}`);
  loadOrders();
};

// Products Section
async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  const productsTable = document.getElementById("productsTable");
  productsTable.innerHTML = "";

  snap.forEach(docSnap => {
    const prod = docSnap.data();
    productsTable.innerHTML += `
      <tr>
        <td>${prod.name || "-"}</td>
        <td>${prod.category || "-"}</td>
        <td>${JSON.stringify(prod.sizePrice || {})}</td>
        <td><button>✏️ Edit</button></td>
      </tr>
    `;
  });
}

window.addProduct = async () => {
  const name = document.getElementById("prodName").value;
  const category = document.getElementById("prodCategory").value;
  const description = document.getElementById("prodDesc").value;
  const features = document.getElementById("prodFeatures").value.split(",");
  const image = document.getElementById("prodImage").value;
  const images = document.getElementById("prodImages").value.split(",");
  const sizePrice = JSON.parse(document.getElementById("prodSizePrice").value);

  await addDoc(collection(db, "products"), {
    name, category, description, features, image, images, sizePrice
  });
  alert("✅ Product added!");
  loadProducts();
};

// Payment Section
async function loadPayment() {
  const snap = await getDocs(collection(db, "settings"));
  snap.forEach(docSnap => {
    if (docSnap.id === "payment") {
      const data = docSnap.data();
      document.getElementById("payPromptpay").value = data.promptpay || "";
      document.getElementById("payBankName").value = data.bankTransfer?.bankName || "";
      document.getElementById("payAccountName").value = data.bankTransfer?.accountName || "";
      document.getElementById("payAccountNumber").value = data.bankTransfer?.accountNumber || "";
      document.getElementById("payCOD").value = data.cod ? "true" : "false";
    }
  });
}

window.savePayment = async () => {
  const data = {
    promptpay: document.getElementById("payPromptpay").value,
    bankTransfer: {
      bankName: document.getElementById("payBankName").value,
      accountName: document.getElementById("payAccountName").value,
      accountNumber: document.getElementById("payAccountNumber").value,
    },
    cod: document.getElementById("payCOD").value === "true"
  };
  await setDoc(doc(db, "settings", "payment"), data);
  alert("✅ Payment settings saved!");
};

// Shipping Section
async function loadShipping() {
  const snap = await getDocs(collection(db, "settings"));
  snap.forEach(docSnap => {
    if (docSnap.id === "shipping") {
      const data = docSnap.data();
      document.getElementById("shipMethod").value = data.method || "";
      document.getElementById("shipCost").value = data.cost || "";
    }
  });
}

window.saveShipping = async () => {
  const data = {
    method: document.getElementById("shipMethod").value,
    cost: parseFloat(document.getElementById("shipCost").value)
  };
  await setDoc(doc(db, "settings", "shipping"), data);
  alert("✅ Shipping settings saved!");
};
