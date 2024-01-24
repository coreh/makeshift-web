import React from "react";
import cn from "classnames";

interface HStackProps {
    grow?: boolean;
    children?: React.ReactNode;
}

export function HStack({ grow, children }: HStackProps) {
    return <div className={cn("HStack", grow && "grow")}>{children}</div>;
}
