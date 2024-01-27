import React from "react";
import cn from "classnames";

interface RStackProps {
    grow?: 0 | 1;
    shrink?: 0 | 1;
    basis?: "auto" | 0;
    gap?: "auto" | 0;
    align?: "start" | "center" | "end" | "stretch";
    justify?:
        | "start"
        | "center"
        | "end"
        | "stretch"
        | "space-between"
        | "space-around"
        | "space-evenly";
    children?: React.ReactNode;
}

export function RStack({
    grow = 0,
    shrink = 1,
    basis = "auto",
    align = "stretch",
    gap = "auto",
    justify = "start",
    children,
}: RStackProps) {
    return (
        <div
            className={cn("RStack", gap === "auto" && `gap`)}
            style={{
                flexGrow: grow,
                flexShrink: shrink,
                flexBasis: basis,
                alignItems: align,
                justifyContent: justify,
            }}
        >
            {children}
        </div>
    );
}
