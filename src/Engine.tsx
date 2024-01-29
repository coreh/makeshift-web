import React, { useEffect, useRef } from "react";

export let sendRequest: (request: any) => Promise<any> = async () => {
    throw new Error("sendRequest not initialized");
};

let didInit = false;

export function Engine() {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (didInit) {
            return;
        }
        didInit = true;

        eval(`(async () => {
            const {
                default: init,
                sendRequest,
            } = await import("/bevy/wasm_example.js");

            init();

            return sendRequest;
        })()`).then((fn: any) => {
            sendRequest = fn;
        });

        const interval = setInterval(() => {
            const canvas = document.querySelector("canvas");
            if (canvas) {
                editorRef.current!.appendChild(canvas!);
                clearInterval(interval);
            }
        }, 50);
    }, []);

    return <div ref={editorRef} className="Engine"></div>;
}
