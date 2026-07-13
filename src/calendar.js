import React, { useState } from 'react';
import './calendar.css';

function Calendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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
  // 7の倍数になるよう末尾を埋める
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
              {week.map((day, di) => (
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
                  {day || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Calendar;
