import React from "react";

export type TopicName =
    | "none"
    | "error-danger"
    | "warning"
    | "success"
    | "light"
    | "resource"
    | "asset"
    | "code"
    | "x"
    | "y"
    | "z";

interface TopicProps {
    children: React.ReactNode;
    topic: TopicName;
}

export function Topic(props: TopicProps) {
    const { children, topic: name } = props;
    return <div className={`Topic topic:${name}`}>{children}</div>;
}
