import React, { useEffect, useId, useRef, useState } from "react";

export interface TextInputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onSave?: (value: string) => void;
}

export function TextInput(props: TextInputProps) {
    const { label, placeholder, value = "", onSave } = props;

    const id = useId();
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.value = value;
        }
    }, [value]);

    return (
        <div className="TextInput">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                ref={ref}
                type="text"
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </div>
    );

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            ref.current!.value = value;
            ref.current!.blur();
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            onSave?.(ref.current!.value);
            return;
        }
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {}

    function handleBlur() {
        onSave?.(ref.current!.value);
    }
}
