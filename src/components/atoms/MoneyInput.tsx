"use client";

import { Input } from "@/components/atoms/Input";
import { formatMoneyInput } from "@/lib/format";
import { forwardRef, useEffect, useState, type ChangeEvent, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "dir" | "value" | "defaultValue"> & {
  value?: string | number;
  defaultValue?: string | number;
};

export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { value, defaultValue, onChange, className, ...props },
  ref,
) {
  const [text, setText] = useState(() => formatMoneyInput(String(value ?? defaultValue ?? "")));

  useEffect(() => {
    if (value == null) return;
    setText(formatMoneyInput(String(value)));
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = formatMoneyInput(event.target.value);
    setText(next);
    event.target.value = next;
    onChange?.(event);
  }

  return (
    <Input
      ref={ref}
      {...props}
      className={className}
      dir="ltr"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={handleChange}
    />
  );
});
