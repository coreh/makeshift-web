import React from "react";
import cn from "classnames";

interface ZStackProps {
    grow?: 0 | 1;
    shrink?: 0 | 1;
    basis?: "auto" | 0;
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "stretch";
}

export function ZStack({
    grow = 0,
    shrink = 0,
    basis = "auto",
    align = "center",
    justify = "center",
    children,
}: React.PropsWithChildren<ZStackProps>) {
    return (
        <div
            className={cn("ZStack")}
            style={{
                flexGrow: grow,
                flexShrink: shrink,
                flexBasis: basis,
                alignItems: align,
                justifyItems: justify,
            }}
        >
            {children}
        </div>
    );
}
