import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const targetProductIds = ["kzv4Npr47H4veRoHpEfS", "oKYDsv2zRCFldMb5n2xw"];
const displayElem = document.getElementById("total");
const shareLink = document.getElementById("share-link");

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

  // 売上表示を更新
  displayElem.textContent = `${abTotalQuantity}`;

  // Twitterリンクも更新
  const text = `現在の売上は ${abTotalQuantity} 個です！`;
  const url = new URL("https://twitter.com/intent/tweet");
  url.searchParams.set("text", text);
  url.searchParams.set("hashtags", "ImagineThePepper,itp,売上公開,やど祭");
  shareLink.href = url.toString();
});
