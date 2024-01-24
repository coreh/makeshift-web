import React from "react";
import { Slot } from "@radix-ui/react-slot";
import cn from "classnames";
import { TopicName } from "./common";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    topic?: TopicName;
    asChild?: boolean;
}

export function Button({ asChild, topic, className, ...props }: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            {...props}
            className={cn("Button", topic && `topic:${topic}`, className)}
        />
    );
}
