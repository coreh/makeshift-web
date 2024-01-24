import React from "react";

interface PanelProps {
    children?: React.ReactNode;
}

export function Panel({ children }: PanelProps) {
    return <div className="Panel">{children}</div>;
}
