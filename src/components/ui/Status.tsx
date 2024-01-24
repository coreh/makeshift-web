import React from "react";
import { UIContext } from "./common";
import cn from "classnames";

interface StatusProps {
    className?: string;
    context: UIContext;
    value: string;
}

export function Status({ context, className, value }: StatusProps) {
    return (
        <div
            role="status"
            className={cn("Status", context && `context:${context}`, className)}
        >
            {value}
        </div>
    );
}
