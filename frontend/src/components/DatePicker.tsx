import { useState, useEffect, useRef } from "react";
import ReactDatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import pt from "date-fns/locale/pt-BR";
import { useTheme } from "./ThemeContext";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Quando?",
  className = "",
}: DatePickerProps) {
  const [date, setDate] = useState<Date | null>(null);
  const datePickerRef = useRef<ReactDatePicker>(null);
  const { theme } = useTheme();

  // Parse string date to Date object when value changes
  useEffect(() => {
    if (value) {
      try {
        // Try to parse the date string if it's in a valid format
        const parts = value.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
          const year = parseInt(parts[2], 10);

          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            setDate(new Date(year, month, day));
            return;
          }
        }

        // If not in DD/MM/YYYY format, try as a general date string
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        } else {
          setDate(null);
        }
      } catch (error) {
        console.error("Error parsing date:", error);
        setDate(null);
      }
    } else {
      setDate(null);
    }
  }, [value]);

  // Format Date object to string when date changes
  const handleDateChange = (selectedDate: Date | null) => {
    setDate(selectedDate);

    if (selectedDate) {
      // Format as DD/MM/YYYY
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = selectedDate.getFullYear();
      onChange(`${day}/${month}/${year}`);
    } else {
      onChange("");
    }
  };

  const handleCalendarClick = () => {
    if (!disabled && datePickerRef.current) {
      datePickerRef.current.setOpen(true);
    }
  };

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2 w-full">
        <Calendar
          className={`size-5 flex-shrink-0 cursor-pointer ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-500"
          }`}
          onClick={handleCalendarClick}
        />
        <ReactDatePicker
          ref={datePickerRef}
          selected={date}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          locale={pt}
          placeholderText={placeholder}
          disabled={disabled}
          className={`bg-transparent text-base sm:text-lg outline-none flex-1 min-w-0 cursor-pointer ${
            theme === "dark"
              ? "placeholder-zinc-400 text-zinc-100"
              : "placeholder-zinc-500 text-zinc-900"
          } ${className}`}
          calendarClassName={`rounded-lg shadow-lg ${
            theme === "dark"
              ? "bg-zinc-800 border border-zinc-700 text-zinc-200"
              : "bg-white border border-zinc-300 text-zinc-900"
          }`}
          dayClassName={() =>
            theme === "dark"
              ? "hover:bg-zinc-700 rounded"
              : "hover:bg-zinc-100 rounded"
          }
          popperClassName="z-[100]"
          popperPlacement="bottom"
          showPopperArrow={false}
          popperModifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 12],
              },
            },
            {
              name: "preventOverflow",
              options: {
                boundary: document.body,
                padding: 20,
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
