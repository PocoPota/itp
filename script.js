import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const targetProductIds = ["kzv4Npr47H4veRoHpEfS", "oKYDsv2zRCFldMb5n2xw"]; // ← 対象の productId をここに
const displayElem = document.getElementById("total");
onSnapshot(collection(db, "pub_sales"), (snapshot) => {
  let abTotalQuantity = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const { items } = data;
    items.forEach(item => {
      if (targetProductIds.includes(item.productId)) {
        abTotalQuantity += item.quantity;
      }
    });
  });
  // 表示更新
  displayElem.textContent = `${abTotalQuantity}`;
});