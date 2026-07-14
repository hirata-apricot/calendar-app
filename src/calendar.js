import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import ScheduleModal from "./ScheduleModal";
import "./calendar.css";
import * as holiday_jp from "@holiday-jp/holiday_jp";

function Calendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // schedules: { "YYYY-MM-DD": [{ id, start_time, title, end_date, end_time, detail }, ...] }
  const [schedules, setSchedules] = useState({});

  // モーダル制御
  // mode: 'new' | 'view'
  const [modal, setModal] = useState(null); // null or { mode, dateKey, schedule }

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const pad = (n) => String(n).padStart(2, "0");

  // Firestoreからスケジュール取得
  const fetchSchedules = async () => {
    const lastDate = new Date(selectedYear, selectedMonth, 0).getDate();
    const startStr = `${selectedYear}-${pad(selectedMonth)}-01`;
    const endStr = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDate)}`;

    try {
      const q = query(
        collection(db, "schedules"),
        where("start_date", ">=", startStr),
        where("start_date", "<=", endStr),
      );
      const snapshot = await getDocs(q);

      const result = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const dateKey = data.start_date;
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push({
          id: doc.id,
          start_date: data.start_date ?? "",
          start_time: data.start_time ?? "",
          end_date: data.end_date ?? "",
          end_time: data.end_time ?? "",
          title: data.title ?? "",
          detail: data.detail ?? "",
        });
      });

      Object.keys(result).forEach((key) => {
        result[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
      });

      setSchedules(result);
    } catch (err) {
      console.error("Firestore取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // カレンダーセル生成
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
  const lastDay = new Date(selectedYear, selectedMonth, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const dayNames = ["月", "火", "水", "木", "金", "土", "日"];

  const isToday = (day) =>
    day === today.getDate() &&
    selectedMonth === today.getMonth() + 1 &&
    selectedYear === today.getFullYear();

  const toDateKey = (day) =>
    `${selectedYear}-${pad(selectedMonth)}-${pad(day)}`;

  // 日付数字をクリック → 新規登録
  const handleDayNumberClick = (e, day) => {
    e.stopPropagation();
    if (!day) return;
    setModal({ mode: "new", dateKey: toDateKey(day), schedule: null });
  };

  // 予定アイテムをクリック → 閲覧
  const handleScheduleClick = (e, schedule) => {
    e.stopPropagation();
    setModal({ mode: "view", dateKey: schedule.start_date, schedule });
  };

  const handleModalClose = () => setModal(null);

  const handleModalSaved = () => {
    setModal(null);
    fetchSchedules();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <label htmlFor="year-select">年</label>

        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label htmlFor="month-select">月</label>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            {dayNames.map((name, i) => (
              <th key={name} className={i === 5 ? "sat" : i === 6 ? "sun" : ""}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const dateKey = day ? toDateKey(day) : null;
                const daySchedules = dateKey ? schedules[dateKey] || [] : [];
                const holiday = holiday_jp.between(
                  new Date(selectedYear, selectedMonth - 1, day),
                  new Date(selectedYear, selectedMonth - 1, day),
                );
                const isHoliday = holiday.length > 0;
                return (
                  <td
                    key={di}
                    className={[
                      day === null ? "empty" : "has-day",
                      di === 5 ? "sat" : di === 6 || isHoliday ? "sun" : "",
                      day && isToday(day) ? "today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {day && (
                      <>
                        {/* 日付数字：クリックで新規登録 */}
                        <span
                          className="cell-day"
                          onClick={(e) => handleDayNumberClick(e, day)}
                          title="クリックして予定を追加"
                        >
                          {day}
                        </span>

                        {/* 予定一覧：クリックで閲覧 */}
                        <div className="cell-schedules">
                          {isHoliday && (
                            // 祝日名表示
                            <div className="holiday-name">
                              {holiday[0].name}
                            </div>
                          )}
                          {daySchedules.map((s) => (
                            <div
                              key={s.id}
                              className="schedule-item"
                              onClick={(e) => handleScheduleClick(e, s)}
                            >
                              {s.start_time && (
                                <span className="schedule-time">
                                  {s.start_time}
                                </span>
                              )}
                              <span className="schedule-title">{s.title}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <ScheduleModal
          mode={modal.mode}
          dateKey={modal.dateKey}
          schedule={modal.schedule}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

export default Calendar;
