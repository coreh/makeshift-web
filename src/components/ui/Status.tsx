import React from "react";
import { TopicName } from "./common";
import cn from "classnames";

interface StatusProps {
    className?: string;
    topic: TopicName;
    value: string;
}

export function Status({ topic, className, value }: StatusProps) {
    return (
        <div
            role="status"
            className={cn("Status", topic && `topic:${topic}`, className)}
        >
            {value}
        </div>
    );
}
