import React, { useState, useEffect } from "react";
import "./MonthDayPicker.css";

export default function MonthDayPicker({
  value,
  onChange,
  placeholder = "Select date (MM-DD)",
}) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    if (value) {
      try {
        const parts = value.split("-");
        if (parts.length === 2) {
          setMonth(parts[0]);
          setDay(parts[1]);
        }
      } catch (e) {
        // ignore invalid format
      }
    }
  }, [value]);

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    if (newMonth && day) {
      onChange(`${newMonth.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }
  };

  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setDay(newDay);
    if (month && newDay) {
      onChange(`${month.padStart(2, "0")}-${newDay.padStart(2, "0")}`);
    }
  };

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getDaysInMonth = (monthNum) => {
    if (!monthNum) return 31;
    const daysMap = {
      "01": 31,
      "02": 29,
      "03": 31,
      "04": 30,
      "05": 31,
      "06": 30,
      "07": 31,
      "08": 31,
      "09": 30,
      10: 31,
      11: 30,
      12: 31,
    };
    return daysMap[monthNum] || 31;
  };

  const maxDays = getDaysInMonth(month);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="month-day-picker">
      <select
        value={month}
        onChange={handleMonthChange}
        className="month-select"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select value={day} onChange={handleDayChange} className="day-select">
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={String(d).padStart(2, "0")}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
