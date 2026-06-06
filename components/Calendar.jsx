import React from "react";
import { useLocale } from "next-intl";
import { getLocaleCode } from "@/utils/localeUtils";

const DAY_LABELS = {
  tr: ["Pzr", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Calendar = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  handleDateClick,
  eventDates,
}) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const weeks = [];
  let week = [];

  for (let i = 0; i < firstDay; i += 1) {
    week.push({
      day: daysInPrevMonth - firstDay + i + 1,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    week.push({ day, isCurrentMonth: true });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  let nextMonthDay = 1;
  while (week.length < 7) {
    week.push({ day: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }

  weeks.push(week);

  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i += 1) {
      extraWeek.push({ day: nextMonthDay, isCurrentMonth: false });
      nextMonthDay += 1;
    }
    weeks.push(extraWeek);
  }

  return (
    <div className="rounded-lg bg-gray-800 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="rounded bg-gray-700 px-3 py-1 text-white transition-colors hover:bg-gray-600"
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        >
          &lt;
        </button>
        <h3 className="text-lg text-white">
          {currentMonth.toLocaleString(getLocaleCode(locale), { month: "long" })}{" "}
          {year}
        </h3>
        <button
          className="rounded bg-gray-700 px-3 py-1 text-white transition-colors hover:bg-gray-600"
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        >
          &gt;
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_LABELS[locale].map((day) => (
          <div key={day} className="text-center text-sm text-gray-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((weekRow, weekIndex) => (
          <React.Fragment key={`week-${weekIndex}`}>
            {weekRow.map((dateObj, dayIndex) => {
              const { day, isCurrentMonth } = dateObj;

              const displayMonth = isCurrentMonth
                ? month
                : day < 15
                  ? month + 1
                  : month - 1;
              const displayYear =
                displayMonth < 0
                  ? year - 1
                  : displayMonth > 11
                    ? year + 1
                    : year;

              const adjustedMonth = (displayMonth + 12) % 12;
              const date = new Date(displayYear, adjustedMonth, day);
              const dateStr = formatDate(date);
              const hasEvent = eventDates.has(dateStr);
              const isSelected =
                selectedDate &&
                date.toDateString() === selectedDate.toDateString();

              const isClickable = isCurrentMonth && hasEvent;

              return (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`flex h-10 w-10 items-center justify-center rounded text-sm ${
                    hasEvent && isCurrentMonth ? "bg-blue-500 text-white" : ""
                  } ${isSelected ? "border-2 border-white" : ""} ${
                    !isCurrentMonth ? "cursor-default text-gray-500" : "text-white"
                  } ${isClickable ? "cursor-pointer hover:bg-blue-600" : "cursor-default"}`}
                  onClick={() => isClickable && handleDateClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
