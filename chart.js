import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

// 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const q = query(collection(db, "pub_sales"), orderBy("createdAt"));

// DOM参照
const tabsElem = document.getElementById("tabs");
const chartsElem = document.getElementById("charts");

// 色生成
function getRandomColor() {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

// データ取得
onSnapshot(q, (snapshot) => {
  const groupedByDate = {};

  snapshot.forEach(doc => {
    const sale = doc.data();
    const date = sale.createdAt.toDate();
    const roundedTime = new Date(Math.floor(date.getTime() / 60000) * 60000);
    const dateKey = roundedTime.toISOString().split("T")[0]; // YYYY-MM-DD

    sale.items.forEach(item => {
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push({
        time: roundedTime,
        quantity: item.quantity
      });
    });
  });

  tabsElem.innerHTML = "";
  chartsElem.innerHTML = "";

  Object.entries(groupedByDate).forEach(([dateKey, records], index) => {
    const chartId = `chart-${dateKey}`;
    
    // ✅ タブ作成
    const tabBtn = document.createElement("button");
    tabBtn.textContent = dateKey;
    tabBtn.onclick = () => {
      document.querySelectorAll("canvas").forEach(c => c.style.display = "none");
      document.getElementById(chartId).style.display = "block";
    };
    tabsElem.appendChild(tabBtn);

    // ✅ Canvas作成
    const canvas = document.createElement("canvas");
    canvas.id = chartId;
    canvas.style.display = index === 0 ? "block" : "none"; // 最初だけ表示
    chartsElem.appendChild(canvas);

    // ✅ データ処理
    const minuteTotals = new Map();
    records.forEach(({ time, quantity }) => {
      const key = time.toISOString();
      minuteTotals.set(key, (minuteTotals.get(key) || 0) + quantity);
    });

    const times = records.map(r => r.time);
    const startTime = new Date(Math.min(...times.map(t => t.getTime())));
    const endTime = new Date(Math.max(...times.map(t => t.getTime())));
    const allTimes = [];
    for (let t = new Date(startTime); t <= endTime; t.setMinutes(t.getMinutes() + 1)) {
      allTimes.push(new Date(t));
    }

    let cumulativeSum = 0;
    const dataPoints = allTimes.map(time => {
      const key = time.toISOString();
      const amount = minuteTotals.get(key) || 0;
      cumulativeSum += amount;
      return {
        x: time.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }),
        y: cumulativeSum
      };
    });

    // ✅ Chart作成
    new Chart(canvas.getContext("2d"), {
      type: 'line',
      data: {
        datasets: [{
          label: `${dateKey} 売上（累計）`,
          data: dataPoints,
          borderColor: getRandomColor(),
          fill: false
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: '時間（1分ごと）' } },
          y: { title: { display: true, text: '累計個数' }, beginAtZero: true }
        }
      }
    });
  });
});
