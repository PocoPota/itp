import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chart.js 初期化
const ctx = document.getElementById("salesChart").getContext("2d");
const salesChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: '売上個数（累計）',
      data: [],
      borderColor: 'blue',
      fill: false,
    }]
  },
  options: {
    scales: {
      x: {
        title: { display: true, text: '時間（1分ごと）' }
      },
      y: {
        title: { display: true, text: '累計個数' },
        beginAtZero: true
      }
    }
  }
});

// Firestoreデータ取得＆グラフ描画
const q = query(collection(db, "pub_sales"), orderBy("createdAt"));
onSnapshot(q, (snapshot) => {
  const data = [];

  snapshot.forEach(doc => {
    const sale = doc.data();
    const date = sale.createdAt.toDate();
    const roundedTime = new Date(Math.floor(date.getTime() / 60000) * 60000);
    sale.items.forEach(item => {
      data.push({
        time: roundedTime,
        quantity: item.quantity
      });
    });
  });

  const minuteTotals = new Map();
  data.forEach(({ time, quantity }) => {
    const key = time.toISOString();
    minuteTotals.set(key, (minuteTotals.get(key) || 0) + quantity);
  });

  const allTimes = [];
  if (data.length > 0) {
    const startTime = new Date(Math.floor(Math.min(...data.map(d => d.time.getTime())) / 60000) * 60000);
    const endTime = new Date(Math.floor(Math.max(...data.map(d => d.time.getTime())) / 60000) * 60000);
    for (let t = new Date(startTime); t <= endTime; t.setMinutes(t.getMinutes() + 1)) {
      allTimes.push(new Date(t));
    }
  }

  let cumulativeSum = 0;
  const cumulativeData = allTimes.map(time => {
    const key = time.toISOString();
    const amount = minuteTotals.get(key) || 0;
    cumulativeSum += amount;
    return { time: new Date(key), total: cumulativeSum };
  });

  // ⏰ 日本時間 + シンプル表示（HH:mm）
  salesChart.data.labels = cumulativeData.map(item =>
    item.time.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  );
  salesChart.data.datasets[0].data = cumulativeData.map(item => item.total);
  salesChart.update();
});
