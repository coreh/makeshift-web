import React from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig } from "swr";

import { Button } from "./components/Button";
import { VStack } from "./components/VStack";
import { HStack } from "./components/HStack";
import { Status } from "./components/Status";
import { EntityTree } from "./EntityTree";

async function fetcher(obj: any) {
    const res = await fetch("http://localhost:8765/brp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(obj),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.content ?? "Unknown error");
    }
    return await res.json();
}

function Ping() {
    const { isLoading, error } = useSWR(
        { request: "PING" },
        { refreshInterval: 1000, errorRetryInterval: 1000 },
    );

    if (error) return <Status context="error-danger" value="Not Connected" />;
    if (isLoading) return <Status context="error-danger" value="Connecting" />;
    return <Status context="success" value="Connected" />;
}

function App() {
    return (
        <SWRConfig value={{ fetcher }}>
            <Ping />
            <EntityTree />
        </SWRConfig>
    );
}

const root = ReactDOM.createRoot(document.querySelector("main")!);
root.render(<App />);
