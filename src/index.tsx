import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import useSWR, { SWRConfig, mutate } from "swr";

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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./components/ui/Select";
import * as Lucide from "lucide-react";

export async function httpFetcher(obj: any, url: string) {
    useGlobalStore.getState().incrementBrpRequest(obj.request);

    const res = await fetch(url, {
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
    useGlobalStore.getState().incrementBrpRequest(obj.request);
    return await sendRequest({ ...obj, id: id++ });
}

export async function fetcher(obj: any) {
    const target = useGlobalStore.getState().target;
    if (target === "http") {
        return await httpFetcher(
            obj,
            `//${new URL(window.location.href).hostname}:8765/brp`,
        );
    } else if (target === "http-local") {
        return await httpFetcher(obj, `http://localhost:8765/brp`);
    } else if (target === "wasm") {
        return await wasmFetcher(obj);
    }
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
    const brpRequests = useGlobalStore((store) => store.brpRequests);
    return (
        <HStack grow={1} shrink={0} basis="auto" align="center">
            <Ping />/
            {brpRequests
                .entrySeq()
                .map(([request, count]) => (
                    <small key={request}>
                        {request} ({count})
                    </small>
                ))
                .toArray()}
        </HStack>
    );
}

function App() {
    const target = useGlobalStore((store) => store.target);

    useEffect(() => {
        useGlobalStore.getState().resetBrpRequests();
        mutate(() => true, undefined, {
            revalidate: true,
        });
    }, [target]);

    return (
        <SWRConfig value={{ fetcher }}>
            <VStack grow={1}>
                <Toolbar>
                    <RStack justify="space-between" grow={1}>
                        <ConnectionInfo />
                        <HStack grow={0} shrink={0} basis="auto" align="center">
                            <Select
                                value={target}
                                onValueChange={(value) => {
                                    useGlobalStore
                                        .getState()
                                        .setTarget(
                                            value as
                                                | "http"
                                                | "http-local"
                                                | "wasm",
                                        );
                                }}
                            >
                                <SelectTrigger>
                                    <label>Target</label>
                                    <SelectValue placeholder="Color Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="wasm">
                                            <Lucide.Package /> WASM
                                        </SelectItem>
                                        <SelectItem value="http">
                                            <Lucide.Wifi /> HTTP (Remote)
                                        </SelectItem>
                                        <SelectItem value="http-local">
                                            <Lucide.ArrowDownToDot /> HTTP
                                            (Localhost)
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </HStack>
                    </RStack>
                </Toolbar>
                <RStack grow={1}>
                    <Panel grow={1}>
                        <EntityTree />
                    </Panel>
                    <Engine active={target === "wasm"} />
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
