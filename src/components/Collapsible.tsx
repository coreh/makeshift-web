import React from "react";
import cn from "classnames";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

export function TreeNode({
    className,
    ...props
}: Collapsible.CollapsibleProps) {
    return <Collapsible.Root {...props} className={cn("TreeNode")} />;
}

export function TreeContent({
    className,
    ...props
}: Collapsible.CollapsibleContentProps) {
    return <Collapsible.Content {...props} className={cn("Content")} />;
}

export function TreeChevron({
    className,
    ...props
}: Collapsible.CollapsibleTriggerProps) {
    return <Collapsible.Trigger {...props} className={cn("Chevron")} />;
}

interface TreeHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
    isSelected?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function TreeHeading({
    isSelected,
    className,
    children,
    ...props
}: TreeHeadingProps) {
    return (
        <div
            className={cn("Heading", isSelected && "state:selected", className)}
            {...props}
        >
            {children}
        </div>
    );
}
