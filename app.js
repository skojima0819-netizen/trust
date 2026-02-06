const STORAGE_KEY = "dailyReports";

const form = document.getElementById("report-form");
const dateInput = document.getElementById("report-date");
const bodyInput = document.getElementById("report-body");
const clearButton = document.getElementById("clear-btn");
const deleteButton = document.getElementById("delete-btn");
const saveStatus = document.getElementById("save-status");
const reportList = document.getElementById("report-list");
const compareA = document.getElementById("compare-a");
const compareB = document.getElementById("compare-b");
const statsA = document.getElementById("stats-a");
const statsB = document.getElementById("stats-b");
const diffA = document.getElementById("diff-a");
const diffB = document.getElementById("diff-b");
const exportButton = document.getElementById("export-btn");

const loadReports = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
};

const saveReports = (reports) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

const getSortedDates = (reports) =>
  Object.keys(reports).sort((a, b) => b.localeCompare(a));

const formatPreview = (text) => {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "本文がありません";
  }
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
};

const buildStats = (text) => {
  const lines = text.split(/\n+/).filter((line) => line.trim().length > 0);
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return {
    lines: lines.length,
    words: words.length,
    chars: text.length,
    focus: lines.slice(0, 3).join(" / ") || "要約がありません",
  };
};

const renderStats = (node, stats) => {
  node.innerHTML = `
    <div>行数: <strong>${stats.lines}</strong></div>
    <div>単語数: <strong>${stats.words}</strong></div>
    <div>文字数: <strong>${stats.chars}</strong></div>
    <div>冒頭メモ: <strong>${stats.focus}</strong></div>
  `;
};

const renderDiff = (listNode, lines) => {
  listNode.innerHTML = "";
  if (lines.length === 0) {
    const item = document.createElement("li");
    item.textContent = "差分はありません";
    listNode.appendChild(item);
    return;
  }
  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    listNode.appendChild(item);
  });
};

const updateList = (reports) => {
  reportList.innerHTML = "";
  const dates = getSortedDates(reports);
  if (dates.length === 0) {
    reportList.textContent = "まだ日報がありません。";
    return;
  }

  dates.forEach((date) => {
    const card = document.createElement("div");
    card.className = "table-item";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = date;
    const preview = document.createElement("span");
    preview.textContent = formatPreview(reports[date]);
    info.appendChild(title);
    info.appendChild(preview);

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "secondary";
    loadButton.textContent = "読み込み";
    loadButton.addEventListener("click", () => {
      dateInput.value = date;
      bodyInput.value = reports[date];
      saveStatus.textContent = "";
    });

    card.appendChild(info);
    card.appendChild(loadButton);
    reportList.appendChild(card);
  });
};

const updateSelects = (reports) => {
  const dates = getSortedDates(reports);
  [compareA, compareB].forEach((select) => {
    const current = select.value;
    select.innerHTML = "";
    dates.forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      select.appendChild(option);
    });
    if (dates.includes(current)) {
      select.value = current;
    }
  });

  if (dates.length >= 2) {
    compareA.value = dates[1];
    compareB.value = dates[0];
  }
  if (dates.length === 1) {
    compareA.value = dates[0];
    compareB.value = dates[0];
  }
};

const updateComparison = (reports) => {
  const reportA = reports[compareA.value] || "";
  const reportB = reports[compareB.value] || "";
  renderStats(statsA, buildStats(reportA));
  renderStats(statsB, buildStats(reportB));

  const linesA = new Set(
    reportA
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
  const linesB = new Set(
    reportB
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
  );

  const onlyA = Array.from(linesA).filter((line) => !linesB.has(line));
  const onlyB = Array.from(linesB).filter((line) => !linesA.has(line));

  renderDiff(diffA, onlyA);
  renderDiff(diffB, onlyB);
};

const refresh = () => {
  const reports = loadReports();
  updateList(reports);
  updateSelects(reports);
  updateComparison(reports);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!dateInput.value) {
    saveStatus.textContent = "日付を選択してください。";
    return;
  }
  const reports = loadReports();
  reports[dateInput.value] = bodyInput.value.trim();
  saveReports(reports);
  saveStatus.textContent = "保存しました。";
  refresh();
});

clearButton.addEventListener("click", () => {
  form.reset();
  saveStatus.textContent = "入力をクリアしました。";
});

deleteButton.addEventListener("click", () => {
  if (!dateInput.value) {
    saveStatus.textContent = "削除する日付を選択してください。";
    return;
  }
  const reports = loadReports();
  if (!reports[dateInput.value]) {
    saveStatus.textContent = "該当の日報が見つかりません。";
    return;
  }
  delete reports[dateInput.value];
  saveReports(reports);
  saveStatus.textContent = "削除しました。";
  refresh();
});

[compareA, compareB].forEach((select) => {
  select.addEventListener("change", () => {
    updateComparison(loadReports());
  });
});

exportButton.addEventListener("click", () => {
  const reports = loadReports();
  const blob = new Blob([JSON.stringify(reports, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "daily-reports.json";
  anchor.click();
  URL.revokeObjectURL(url);
});

const today = new Date().toISOString().slice(0, 10);
if (!dateInput.value) {
  dateInput.value = today;
}

refresh();
