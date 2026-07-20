import React, { useState, useEffect } from 'react';

/**
 * Props for the DateOfBirthPicker component.
 */
interface DateOfBirthPickerProps {
  /** ISO date string (YYYY-MM-DD) used as the controlled value */
  value: string;
  /** Callback invoked with the new ISO date string when a valid date is selected */
  onChange: (isoDate: string) => void;
  /** Optional error message to display below the picker */
  error?: string;
  /** Optional label text */
  label?: string;
}

/**
 * Web‑only Date of Birth picker respecting age constraints (13‑120 years).
 * Renders a styled native <input type="date"> matching the design system.
 */
export const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  value,
  onChange,
  error,
  label = 'Date of Birth',
}) => {
  const [internalValue, setInternalValue] = useState<string>(value);
  const [validationError, setValidationError] = useState<string | undefined>(error);

  // Helper: start of today (midnight)
  const startOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Helper: subtract years from a date, returning a new Date
  const subYears = (date: Date, years: number) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - years);
    return d;
  };

  // Helper: format Date to YYYY-MM-DD (for input min/max values)
  const toIsoDate = (date: Date) => date.toISOString().split('T')[0];

  // Helper: format Date to DD/MM/YYYY for display (optional)
  const formatDisplay = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  // Compute limits once
  const today = startOfToday();
  const minDate = toIsoDate(subYears(today, 120)); // 120 years ago
  const maxDate = toIsoDate(today); // Up to today

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Validation logic
  const validate = (iso: string) => {
    if (!iso) return undefined;
    const parsed = new Date(iso);
    if (isNaN(parsed.getTime())) {
      return 'Invalid date format.';
    }
    // Ensure parsed date is not today
    const parsedMidnight = new Date(parsed);
    parsedMidnight.setHours(0, 0, 0, 0);
    if (parsedMidnight.getTime() === today.getTime()) {
      return 'Date of birth cannot be today.';
    }
    // Age calculation
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
      age--;
    }
    if (age < 0) return 'Date of birth cannot be in the future.';
    if (age > 120) return 'Age cannot exceed 120 years.';
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value; // YYYY-MM-DD
    setInternalValue(iso);
    const err = validate(iso);
    setValidationError(err);
    if (!err) {
      onChange(iso);
    }
  };

  // Optional display value (DD/MM/YYYY) for UI consistency
  const displayValue = internalValue ? formatDisplay(new Date(internalValue)) : '';

  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        type="date"
        value={internalValue}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        placeholder="Select Date of Birth"
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          backgroundColor: '#fff',
          color: '#111827',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {/* Show formatted date for reference */}
      {internalValue && (
        <p style={{ marginTop: '4px', fontSize: '12px', color: '#374151' }}>{displayValue}</p>
      )}
      {(validationError || error) && (
        <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{validationError || error}</p>
      )}
    </div>
  );
};
export default DateOfBirthPicker;
