import React, { useId } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { LucideCheck } from "lucide-react";

interface CheckboxProps {
    label?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked = false, onChange }: CheckboxProps) {
    const id = useId();
    return (
        <CheckboxPrimitive.Root
            className="Checkbox"
            checked={checked}
            id={id}
            onCheckedChange={onChange}
        >
            <label className="Label" htmlFor={id}>
                {label}
            </label>
            <div className="CheckArea">
                <CheckboxPrimitive.Indicator className="Indicator">
                    <LucideCheck />
                </CheckboxPrimitive.Indicator>
            </div>
        </CheckboxPrimitive.Root>
    );
}
