import React from "react";
import cn from "classnames";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

export function Collapsible({
    ...props
}: CollapsiblePrimitive.CollapsibleProps) {
    return <CollapsiblePrimitive.Root {...props} />;
}

export function CollapsibleContent({
    ...props
}: CollapsiblePrimitive.CollapsibleContentProps) {
    return <CollapsiblePrimitive.Content {...props} />;
}

export function CollapsibleTrigger({
    ...props
}: CollapsiblePrimitive.CollapsibleTriggerProps) {
    return <CollapsiblePrimitive.Trigger {...props} />;
}

interface TreeHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
}

export function CollapsibleHeading({ children, ...props }: TreeHeadingProps) {
    return <div {...props}>{children}</div>;
}
