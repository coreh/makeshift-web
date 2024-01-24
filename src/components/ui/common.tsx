import React from "react";

export type TopicName =
    | "primary"
    | "error-danger"
    | "warning"
    | "success"
    | "light"
    | "resource"
    | "asset"
    | "code"
    | "none";

interface TopicProps {
    children: React.ReactNode;
    name: TopicName;
}

export function Topic(props: TopicProps) {
    const { children, name } = props;
    return <div className={`topic:${name}`}>{children}</div>;
}
