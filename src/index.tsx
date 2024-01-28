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
import { RStack } from "./components/layout/RStack";
import { useGlobalStore } from "./store";

export async function fetcher(obj: any) {
    useGlobalStore.getState().incrementBrpRequest(obj.request);

    const url = new URL(window.location.href);
    const res = await fetch(`http://${url.hostname}:8765/brp`, {
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

function ConnectionInfo() {
    const { brpRequests } = useGlobalStore();
    return (
        <HStack grow={1} shrink={0} align="center">
            <Ping />
            {brpRequests
                .entrySeq()
                .map(([request, count]) => (
                    <div key={request}>
                        {request} ({count})
                    </div>
                ))
                .toArray()}
        </HStack>
    );
}

function App() {
    return (
        <SWRConfig value={{ fetcher }}>
            <VStack grow={1}>
                <Toolbar>
                    <ConnectionInfo />
                </Toolbar>
                <RStack grow={1}>
                    <Panel grow={1}>
                        <EntityTree />
                    </Panel>
                    <Panel grow={2}>
                        <Inspector />
                    </Panel>
                </RStack>
            </VStack>
        </SWRConfig>
    );
}

const root = ReactDOM.createRoot(document.querySelector("main")!);
root.render(<App />);
