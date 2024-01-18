import React from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig } from "swr";

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

    if (error) return <div>Not Connected</div>;
    if (isLoading) return <div>Connecting...</div>;
    return <div>Connected</div>;
}

function App() {
    return (
        <SWRConfig value={{ fetcher }}>
            <Ping />
        </SWRConfig>
    );
}

const root = ReactDOM.createRoot(document.querySelector("main")!);
root.render(<App />);
