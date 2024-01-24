import React, { useRef } from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig } from "swr";

import { Status } from "./components/ui/Status";
import { EntityTree } from "./EntityTree";
import { Inspector } from "./Inspector";
import { VStack } from "./components/layout/VStack";
import { Panel } from "./components/ui/Panel";
import { HStack } from "./components/layout/HStack";
import { Toolbar } from "./components/ui/Toolbar";

export async function fetcher(obj: any) {
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

    if (error) return <Status topic="error-danger" value="Not Connected" />;
    if (isLoading) return <Status topic="error-danger" value="Connecting" />;
    return <Status topic="success" value="Connected" />;
}

function App() {
    return (
        <SWRConfig value={{ fetcher }}>
            <VStack grow={1}>
                <Toolbar>
                    <Ping />
                </Toolbar>
                <HStack grow={1}>
                    <Panel>
                        <EntityTree />
                    </Panel>
                    <Panel>
                        <Inspector />
                    </Panel>
                </HStack>
            </VStack>
        </SWRConfig>
    );
}

const root = ReactDOM.createRoot(document.querySelector("main")!);
root.render(<App />);
