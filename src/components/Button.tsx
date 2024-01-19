import React from "react";
import { Slot } from "@radix-ui/react-slot";
import cn from "classnames";
import { UIContext } from "./common";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    context?: UIContext;
    asChild?: boolean;
}

export function Button({ asChild, context, className, ...props }: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            {...props}
            className={cn("Button", context && `context:${context}`, className)}
        />
    );
}
