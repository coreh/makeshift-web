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
import { Engine, sendRequest } from "./Engine";

export async function httpFetcher(obj: any) {
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

let id = 0;
export async function wasmFetcher(obj: any) {
    return await sendRequest({ ...obj, id: id++ });
}

export const fetcher = wasmFetcher;

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
    const brpRequests = useGlobalStore((store) => store.brpRequests);
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
                    <Panel grow={3}>
                        <Engine />
                    </Panel>
                    <Panel grow={1}>
                        <Inspector />
                    </Panel>
                </RStack>
            </VStack>
        </SWRConfig>
    );
}

const root = ReactDOM.createRoot(document.querySelector("main")!);
root.render(<App />);
