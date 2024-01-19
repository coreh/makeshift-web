import React from "react";

interface ToolbarProps {
    children?: React.ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
    return <div className="Toolbar">{children}</div>;
}
