import React from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocaleCode } from "@/utils/localeUtils";

const DAY_LABELS = {
  tr: ["Pzr", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const NAV_LABELS = {
  tr: { previous: "Önceki ay", next: "Sonraki ay" },
  en: { previous: "Previous month", next: "Next month" },
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
    <div className="border-t-2 border-ink pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={NAV_LABELS[locale].previous}
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2 className="font-display text-lg font-bold capitalize">
          {currentMonth.toLocaleString(getLocaleCode(locale), { month: "long" })}{" "}
          <span className="tabular-nums">{year}</span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={NAV_LABELS[locale].next}
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS[locale].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground">
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
              const Cell = isClickable ? "button" : "div";

              return (
                <Cell
                  {...(isClickable ? { type: "button", "aria-pressed": !!isSelected } : {})}
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`flex h-11 items-center justify-center rounded border-2 font-outlier text-sm tabular-nums ${
                    hasEvent && isCurrentMonth
                      ? "bg-brand font-medium text-brand-ink"
                      : ""
                  } ${isSelected ? "border-ink" : "border-transparent"} ${
                    !isCurrentMonth
                      ? "cursor-default text-muted-foreground opacity-50"
                      : hasEvent
                        ? ""
                        : "text-ink"
                  } ${isClickable ? "cursor-pointer hover:bg-brand-hover" : "cursor-default"}`}
                  onClick={() => isClickable && handleDateClick(day)}
                >
                  {day}
                </Cell>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
