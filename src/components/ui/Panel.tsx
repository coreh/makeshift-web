import React from "react";

interface PanelProps {
    grow?: number;
    shrink?: number;
    children?: React.ReactNode;
    basis?: "auto" | 0;
}

export function Panel({ basis, grow, shrink, children }: PanelProps) {
    return (
        <div
            className="Panel"
            style={{
                flexBasis: basis ?? 0,
                flexGrow: grow ?? 1,
                flexShrink: shrink ?? 0,
            }}
        >
            {children}
        </div>
    );
}
