import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './calendar.css';

function Calendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // schedules: { "YYYY-MM-DD": [{start_time, title}, ...] }
  const [schedules, setSchedules] = useState({});

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 年・月が変わったらFirestoreからその月分のスケジュールを取得
  useEffect(() => {
    const fetchSchedules = async () => {
      // 月の開始日・終了日（YYYY-MM-DD文字列）
      const pad = (n) => String(n).padStart(2, '0');
      const lastDate = new Date(selectedYear, selectedMonth, 0).getDate();
      const startStr = `${selectedYear}-${pad(selectedMonth)}-01`;
      const endStr = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDate)}`;

      try {
        const q = query(
          collection(db, 'schedules'),
          where('start_date', '>=', startStr),
          where('start_date', '<=', endStr)
        );
        const snapshot = await getDocs(q);

        const result = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const dateKey = data.start_date; // "YYYY-MM-DD"
          if (!result[dateKey]) result[dateKey] = [];
          result[dateKey].push({
            start_time: data.start_time ?? '',
            title: data.title ?? '',
          });
        });

        // 同じ日の複数スケジュールをstart_time順にソート
        Object.keys(result).forEach((key) => {
          result[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        setSchedules(result);
      } catch (err) {
        console.error('Firestore取得エラー:', err);
      }
    };

    fetchSchedules();
  }, [selectedYear, selectedMonth]);

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
  const lastDay = new Date(selectedYear, selectedMonth, 0);

  // 月曜始まりに合わせた開始オフセット（月曜=0, 火曜=1, ..., 日曜=6）
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  // カレンダーのセルを生成
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // 週ごとに分割
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  const isToday = (day) =>
    day === today.getDate() &&
    selectedMonth === today.getMonth() + 1 &&
    selectedYear === today.getFullYear();

  // 日付からFirestoreキー "YYYY-MM-DD" を生成
  const toDateKey = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${selectedYear}-${pad(selectedMonth)}-${pad(day)}`;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <label htmlFor="year-select">年：</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>

        <label htmlFor="month-select">月：</label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            {dayNames.map((name, i) => (
              <th
                key={name}
                className={i === 5 ? 'sat' : i === 6 ? 'sun' : ''}
              >
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
                const daySchedules = dateKey ? (schedules[dateKey] || []) : [];
                return (
                  <td
                    key={di}
                    className={
                      [
                        day === null ? 'empty' : '',
                        di === 5 ? 'sat' : di === 6 ? 'sun' : '',
                        day && isToday(day) ? 'today' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')
                    }
                  >
                    {day && (
                      <>
                        <span className="cell-day">{day}</span>
                        <div className="cell-schedules">
                          {daySchedules.map((s, si) => (
                            <div key={si} className="schedule-item">
                              {s.start_time && (
                                <span className="schedule-time">{s.start_time}</span>
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
    </div>
  );
}

export default Calendar;
