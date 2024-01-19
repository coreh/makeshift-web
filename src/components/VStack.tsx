import React from "react";
import cn from "classnames";

interface VStackProps {
    grow?: boolean;
    children?: React.ReactNode;
}

export function VStack({ grow, children }: VStackProps) {
    return <div className={cn("VStack", grow && "grow")}>{children}</div>;
}
