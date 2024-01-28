import React, { useEffect, useId, useRef, useState } from "react";
import * as Lucide from "lucide-react";
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

export interface NumberInputProps {
    label?: string;
    placeholder?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    onSave?: (value: number) => void;
}

export function NumberInput(props: NumberInputProps) {
    const {
        label,
        placeholder,
        value = 0,
        max = Infinity,
        min = -Infinity,
        step = 1,
        precision = 0.00001,
        onSave,
    } = props;

    const id = useId();
    const ref = useRef<HTMLInputElement>(null);
    const isDraggingSlider = useRef(false);
    const draggingSliderStartClientX = useRef(0);
    const draggingSliderStartValue = useRef(0);
    const numberFormatter = Intl.NumberFormat("en", {
        useGrouping: false,
        maximumFractionDigits: Math.max(-Math.log10(precision), 0),
    });
    const valueAsString: string = value ? numberFormatter.format(value) : "0";

    let trackerLeft = 0;
    let trackerRight = 0;
    let showTracker = false;
    if (min > -Infinity && max < Infinity) {
        if (min >= 0 && max > 0) {
            showTracker = true;
            trackerLeft = 0;
            trackerRight = (max - value) / (max - min);
        } else if (min < 0 && max <= 0) {
            showTracker = true;
            trackerLeft = (value - min) / (max - min);
            trackerRight = 0;
        } else if (min < 0 && max > 0) {
            showTracker = true;
            if (value > 0) {
                trackerLeft = 0.5;
                trackerRight = (max - value) / (max - 0) / 2;
            } else {
                trackerLeft = (value - min) / (0 - min) / 2;
                trackerRight = 0.5;
            }
        }
    }

    useEffect(() => {
        if (ref.current) {
            ref.current.value = valueAsString;
        }
    }, [value]);

    useEffect(() => {
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointermove", handlePointerMove);
        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointermove", handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    return (
        <div className="NumberInput">
            {showTracker && (
                <div
                    className="Tracker"
                    style={{
                        left: `${trackerLeft * 100}%`,
                        right: `${trackerRight * 100}%`,
                    }}
                />
            )}
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                ref={ref}
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            <div className="Slider" onPointerDown={handleSliderPointerDown} />
            <button
                className="Decrement"
                onPointerDown={handleDecrement}
                tabIndex={-1}
            >
                <Lucide.ChevronLeft />
            </button>
            <button
                className="Increment"
                onPointerDown={handleIncrement}
                tabIndex={-1}
            >
                <Lucide.ChevronRight />
            </button>
        </div>
    );

    function handleSliderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingSlider.current = true;
        draggingSliderStartClientX.current = e.clientX;
        draggingSliderStartValue.current = value;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            reset();
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            save();
            return;
        }
    }

    function handleIncrement() {
        adjust(+step);
    }

    function handleDecrement() {
        adjust(-step);
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {}

    function handleBlur() {
        save();
    }

    function reset() {
        ref.current!.value = valueAsString;
    }

    function save() {
        let newValue = parseFloat(ref.current!.value);
        if (isNaN(newValue)) {
            reset();
        }
        newValue = Math.min(Math.max(newValue, min), max);
        ref.current!.value = numberFormatter.format(newValue);
        onSave?.(newValue);
    }

    function adjust(amount: number) {
        let newValue = value + amount;
        newValue = Math.min(Math.max(newValue, min), max);
        ref.current!.value = numberFormatter.format(newValue);
        onSave?.(newValue);
    }

    function handlePointerUp(e: PointerEvent) {
        if (isDraggingSlider.current) {
            e.preventDefault();
            e.stopPropagation();
            isDraggingSlider.current = false;
            const deltaX = e.clientX - draggingSliderStartClientX.current;
            const numSteps = Math.round(deltaX);
            if (numSteps === 0) {
                ref.current!.focus();
                ref.current!.select();
            }
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (isDraggingSlider.current) {
            const deltaX = e.clientX - draggingSliderStartClientX.current;
            const numSteps = Math.round(deltaX);
            const newValue = draggingSliderStartValue.current + numSteps * step;
            adjust(newValue - value);
        }
    }
}
