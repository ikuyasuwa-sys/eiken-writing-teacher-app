import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import "./style.css";

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function App() {
  const [password, setPassword] = useState("");
  const [teacherData, setTeacherData] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSubmissions() {
    setLoading(true);

    try {
      const q = query(
        collection(db, "submissions"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const records = [];

      snapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTeacherData(records);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredTeacherData = teacherData.filter((item) => {
    const studentLabel = item.studentNumber
      ? `${item.studentNumber}番`
      : item.studentName || "";

    const matchesName =
      !teacherSearch ||
      String(studentLabel)
        .toLowerCase()
        .includes(teacherSearch.toLowerCase());

    const matchesClass =
      !classFilter ||
      String(item.className || "") === classFilter;

    return matchesName && matchesClass;
  });

  const totalSubmissions = filteredTeacherData.length;

  const averageScore =
    totalSubmissions > 0
      ? (
          filteredTeacherData.reduce(
            (sum, item) => sum + Number(item.score || 0),
            0
          ) / totalSubmissions
        ).toFixed(1)
      : "0.0";

  const averageWords =
    totalSubmissions > 0
      ? Math.round(
          filteredTeacherData.reduce(
            (sum, item) => sum + Number(item.words || 0),
            0
          ) / totalSubmissions
        )
      : 0;

  const classOptions = [
    ...new Set(
      teacherData
        .map((item) => item.className)
        .filter(Boolean)
    )
  ];

  const classSummary = classOptions.map((className) => {
    const records = teacherData.filter(
      (item) => item.className === className
    );

    const avgScore =
      records.length > 0
        ? (
            records.reduce(
              (sum, item) => sum + Number(item.score || 0),
              0
            ) / records.length
          ).toFixed(1)
        : "0.0";

    const avgWords =
      records.length > 0
        ? Math.round(
            records.reduce(
              (sum, item) => sum + Number(item.words || 0),
              0
            ) / records.length
          )
        : 0;

    return {
      className,
      count: records.length,
      avgScore,
      avgWords
    };
  });
const studentHistoryGroups = {};

teacherData.forEach((item) => {
  const studentKey =
    item.studentId ||
    `${item.className || "クラス未入力"}-${item.studentNumber || item.studentName || "番号未入力"}`;

  if (!studentHistoryGroups[studentKey]) {
    studentHistoryGroups[studentKey] = {
      studentId: studentKey,
      className: item.className || "クラス未入力",
      studentNumber: item.studentNumber || "",
      studentName: item.studentName || "",
      records: []
    };
  }

  studentHistoryGroups[studentKey].records.push(item);
});

const studentHistories = Object.values(studentHistoryGroups).map((group) => {
  const records = group.records;

  const averageScore =
    records.length > 0
      ? (
          records.reduce(
            (sum, item) => sum + Number(item.score || 0),
            0
          ) / records.length
        ).toFixed(1)
      : "0.0";

  const averageWords =
    records.length > 0
      ? Math.round(
          records.reduce(
            (sum, item) => sum + Number(item.words || 0),
            0
          ) / records.length
        )
      : 0;

  return {
    ...group,
    count: records.length,
    averageScore,
    averageWords
  };
});
  function downloadTeacherCsv() {
    const header = [
      "クラス",
      "出席番号",
      "生徒ID",
      "級",
      "形式",
      "問題",
      "得点",
      "満点",
      "語数",
      "英文",
      "AI総評"
    ];

    const rows = filteredTeacherData.map((item) => [
      item.className || "",
      item.studentNumber || "",
      item.studentId || "",
      item.level || "",
      item.taskType || "",
      item.topic || "",
      item.score || "",
      item.maxScore || "",
      item.words || "",
      item.essay || "",
      item.aiComment || ""
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
if (password !== "6911") {
  return (
    <main className="app">
      <section className="card">
        <h1>先生用ログイン</h1>

        <p>
          パスワードを入力してください。
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="パスワード"
        />
      </section>
    </main>
  );
}
  return (
    <main className="app">
      <section className="hero card">
        <div>
          <p className="eyebrow">英検ライティング管理画面</p>
          <h1>先生用ダッシュボード</h1>
          <p>
            Firestoreに保存された生徒の提出結果を確認できます。
          </p>
        </div>

        <div className="actions">
          <button onClick={loadSubmissions}>
            {loading ? "読み込み中..." : "最新データを読み込む"}
          </button>

          <button
            className="success"
            onClick={downloadTeacherCsv}
            disabled={filteredTeacherData.length === 0}
          >
            CSV出力
          </button>
        </div>
      </section>

      <section className="card">
        <h2>集計</h2>

        <div className="grid2">
          <div className="history">
            <strong>提出件数</strong>
            <p>{totalSubmissions}件</p>
          </div>

          <div className="history">
            <strong>平均点</strong>
            <p>{averageScore}点</p>
          </div>

          <div className="history">
            <strong>平均語数</strong>
            <p>{averageWords}語</p>
          </div>

          <div className="history">
            <strong>全データ件数</strong>
            <p>{teacherData.length}件</p>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: "16px" }}>
          <label>
            出席番号検索
            <input
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="例：17"
            />
          </label>

          <label>
            クラス絞り込み
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">すべてのクラス</option>

              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>クラス別集計</h2>

        {classSummary.length === 0 && (
          <p>まだ提出データがありません。</p>
        )}

        {classSummary.map((item) => (
          <div key={item.className} className="history">
            <p>
              <strong>{item.className}</strong>
            </p>
            <p>提出数：{item.count}件</p>
            <p>平均点：{item.avgScore}点</p>
            <p>平均語数：{item.avgWords}語</p>
          </div>
        ))}
      </section>
<section className="card">
  <h2>生徒別提出履歴</h2>

  {studentHistories.length === 0 && (
    <p>まだ提出履歴がありません。</p>
  )}

  {studentHistories.map((student) => (
    <details key={student.studentId} className="history">
      <summary className="submissionSummary">
        <strong>
          {student.className} /{" "}
          {student.studentNumber
            ? `${student.studentNumber}番`
            : student.studentName || "番号未入力"}
        </strong>

        <span>
          提出{student.count}回・平均{student.averageScore}点・平均{student.averageWords}語
        </span>
      </summary>

      <div className="submissionDetail">
        {student.records.map((item, index) => (
          <div key={item.id} className="innerDetails">
            <p>
              <strong>{index + 1}回目</strong>
            </p>

            <p>級：{item.level}</p>
            <p>形式：{item.taskType}</p>
            <p>問題：{item.topic}</p>
            <p>得点：{item.score}</p>
            <p>語数：{item.words}</p>

            {item.essay && (
              <details>
                <summary>英文を見る</summary>
                <p>{item.essay}</p>
              </details>
            )}

            {item.aiComment && (
              <details>
                <summary>AI総評を見る</summary>
                <p>{item.aiComment}</p>
              </details>
            )}
          </div>
        ))}
      </div>
    </details>
  ))}
</section>
``

    </main>
  );
}
