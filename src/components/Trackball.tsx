import React, { useEffect, useRef, useState } from "react";
import { Quaternion, Matrix4, Vector3 } from "@math.gl/core";

export interface TrackballProps {
    x: number;
    y: number;
    z: number;
    w: number;
    onSave: (x: number, y: number, z: number, w: number) => void;
}

export function Trackball(props: TrackballProps) {
    const [isDraggingRing, setIsDraggingRing] = useState(false);
    const [isDraggingBall, setIsDraggingBall] = useState(false);
    const ringRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<HTMLDivElement>(null);

    const quat = new Quaternion(
        props.x ?? 0,
        props.y ?? 0,
        props.z ?? 0,
        props.w ?? 0,
    );

    useEffect(() => {
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointermove", handlePointerMove);
        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointermove", handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    const x = new Vector3(1, 0, 0);
    const y = new Vector3(0, 1, 0);
    const z = new Vector3(0, 0, 1);

    x.transformByQuaternion(quat);
    y.transformByQuaternion(quat);
    z.transformByQuaternion(quat);

    const offset = 150;

    return (
        <div className="Trackball">
            <div
                className="Ring"
                tabIndex={0}
                ref={ringRef}
                onPointerDown={handleRingPointerDown}
            >
                <div
                    className="Ball"
                    tabIndex={0}
                    ref={ballRef}
                    onPointerDown={handleBallPointerDown}
                >
                    <div className="Gymbal">
                        <div
                            className="Axis X"
                            style={{
                                transform: `translate(${x.x * offset}%, ${-x.y * offset}%) scale(${1.0 + x.z * 0.1})`,
                                opacity: Math.max(0.75, +x.z),
                                zIndex: Math.round(1 + x.z),
                            }}
                        >
                            X
                        </div>
                        <div
                            className="Axis Y"
                            style={{
                                transform: `translate(${y.x * offset}%, ${-y.y * offset}%) scale(${1.0 + y.z * 0.1})`,
                                opacity: Math.max(0.75, +y.z),
                                zIndex: Math.round(1 + y.z),
                            }}
                        >
                            Y
                        </div>
                        <div
                            className="Axis Z"
                            style={{
                                transform: `translate(${z.x * offset}%, ${-z.y * offset}%) scale(${1.0 + z.z * 0.1})`,
                                opacity: Math.max(0.75, +z.z),
                                zIndex: Math.round(1 + z.z),
                            }}
                        >
                            Z
                        </div>
                        <div
                            className="Axis MinusX"
                            style={{
                                transform: `translate(${-x.x * offset}%, ${x.y * offset}%) scale(${1.0 - x.z * 0.1})`,
                                opacity: Math.max(0.75, -x.z),
                                zIndex: Math.round(1 - x.z),
                            }}
                        >
                            -X
                        </div>
                        <div
                            className="Axis MinusY"
                            style={{
                                transform: `translate(${-y.x * offset}%, ${y.y * offset}%) scale(${1.0 - y.z * 0.1})`,
                                opacity: Math.max(0.75, -y.z),
                                zIndex: Math.round(1 - y.z),
                            }}
                        >
                            -Y
                        </div>
                        <div
                            className="Axis MinusZ"
                            style={{
                                transform: `translate(${-z.x * offset}%, ${z.y * offset}%) scale(${1.0 - z.z * 0.25})`,
                                opacity: Math.max(0.75, -z.z),
                                zIndex: Math.round(1 - z.z),
                            }}
                        >
                            -Z
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    function handleBallPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBall(true);
        ballRef.current!.focus();
    }

    function handleRingPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingRing(true);
        ringRef.current!.focus();
    }

    function handlePointerUp(e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBall(false);
        setIsDraggingRing(false);
    }

    function handlePointerMove(e: PointerEvent) {
        if (isDraggingBall) {
            const deltaX = e.movementX / 100;
            const deltaY = e.movementY / 100;

            const quatY = new Quaternion().fromAxisRotation([0, 1, 0], deltaX);
            const quatX = new Quaternion().fromAxisRotation([1, 0, 0], deltaY);

            const quatResult = new Quaternion();

            quatResult.multiply(quatY);
            quatResult.multiply(quatX);
            quatResult.multiply(quat);

            quatResult.normalize();

            props.onSave(
                quatResult.x,
                quatResult.y,
                quatResult.z,
                quatResult.w,
            );
        } else if (isDraggingRing) {
            const ringBounds = ringRef.current!.getBoundingClientRect();
            const ringCenterX = ringBounds.left + ringBounds.width / 2;
            const ringCenterY = ringBounds.top + ringBounds.height / 2;

            const initialAngle = Math.atan2(
                e.clientY - e.movementY - ringCenterY,
                e.clientX - e.movementX - ringCenterX,
            );

            const finalAngle = Math.atan2(
                e.clientY - ringCenterY,
                e.clientX - ringCenterX,
            );

            const deltaAngle = finalAngle - initialAngle;

            const quatZ = new Quaternion().fromAxisRotation(
                [0, 0, 1],
                -deltaAngle,
            );

            const quatResult = new Quaternion();

            quatResult.multiply(quatZ);
            quatResult.multiply(quat);

            quatResult.normalize();

            props.onSave(
                quatResult.x,
                quatResult.y,
                quatResult.z,
                quatResult.w,
            );
        }
    }
}
