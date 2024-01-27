import React, { useEffect, useId, useRef, useState } from "react";
import { ZStack } from "../layout/ZStack";
import { Color } from "../../utils/color";
import { flushSync } from "react-dom";

export interface ColorWheelProps {
    value?: Color;
    linearColorspace?: boolean;
    onChange?: (value: Color) => void;
}

export function ColorWheel(props: ColorWheelProps) {
    const isDraggingWheelRef = useRef(false);
    const isDraggingBoxRef = useRef(false);
    const wheelRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    const svgFilterId = useId();
    const {
        value = Color.rgba(1, 1, 1, 1),
        onChange,
        linearColorspace,
    } = props;

    const sdrSafeValue = Color.sdrSafe(value);
    const {
        Rgba: { red, green, blue, alpha },
    } = Color.toRgba(sdrSafeValue);

    const {
        Hsla: { hue, saturation, lightness },
    } = Color.toHsla(sdrSafeValue);

    const hueX = Math.sin((hue / 180) * Math.PI);
    const hueY = -Math.cos((hue / 180) * Math.PI);

    useEffect(() => {
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointermove", handlePointerMove);
        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointermove", handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    return (
        <div className="ColorWheel">
            <ZStack grow={1}>
                {linearColorspace && <SVGFilter id={svgFilterId} />}
                <div className="Wheel HueGradient" />
                <div
                    ref={wheelRef}
                    className="Wheel"
                    onPointerDown={handleWheelPointerDown}
                >
                    <div
                        className="Handle Hue"
                        style={{
                            top: `calc(50% + ${hueY} * (50% - 3px))`,
                            left: `calc(50% + ${hueX} * (50% - 3px))`,
                            background: `hsl(${hue}, 100%, 50%)`,
                        }}
                    />
                </div>
                <div
                    ref={boxRef}
                    className="Box"
                    onPointerDown={handleBoxPointerDown}
                    style={{
                        filter: linearColorspace
                            ? `url('#${svgFilterId}')`
                            : undefined,
                    }}
                >
                    <div style={{ background: `hsl(${hue}, 100%, 50%)` }} />
                    <div className="SaturationGradient" />
                    <div className="LightnessGradient" />
                    {linearColorspace && <div className="Blur" />}
                    <div
                        className="Handle SaturationLightness"
                        style={{
                            top: `${100 - lightness * 100}%`,
                            left: `${saturation * 100}%`,
                            background: linearColorspace
                                ? `color(srgb-linear ${red} ${green} ${blue})`
                                : `color(srgb ${red} ${green} ${blue})`,
                        }}
                    />
                </div>
            </ZStack>
        </div>
    );

    function handleBoxPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingBoxRef.current = true;
        boxRef.current!.focus();
        handlePointerMove(e.nativeEvent);
    }

    function handleWheelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingWheelRef.current = true;
        wheelRef.current!.focus();
        handlePointerMove(e.nativeEvent);
    }

    function handlePointerUp(e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingWheelRef.current = false;
        isDraggingBoxRef.current = false;
    }

    function handlePointerMove(e: PointerEvent) {
        if (isDraggingBoxRef.current) {
            const boxBounds = boxRef.current!.getBoundingClientRect();
            const x = Math.max(
                0,
                Math.min((e.clientX - boxBounds.left) / boxBounds.width, 1),
            );
            const y = Math.max(
                0,
                Math.min((e.clientY - boxBounds.top) / boxBounds.height, 1),
            );

            const lightness = 1 - y;
            const saturation = x;

            onChange?.(Color.hsla(hue, saturation, lightness, alpha));
        } else if (isDraggingWheelRef.current) {
            const ringBounds = wheelRef.current!.getBoundingClientRect();
            const ringCenterX = ringBounds.left + ringBounds.width / 2;
            const ringCenterY = ringBounds.top + ringBounds.height / 2;

            const angle = Math.atan2(
                e.clientY - ringCenterY,
                e.clientX - ringCenterX,
            );

            let hue = Math.round((angle / Math.PI) * 180) + 90;
            if (hue > 360) {
                hue -= 360;
            }
            if (hue < 0) {
                hue += 360;
            }

            onChange?.(Color.hsla(hue, saturation, lightness, alpha));
        }
    }
}
function SVGFilter(props: { id: string }) {
    return (
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
                <filter id={props.id}>
                    <feComponentTransfer>
                        <feFuncR
                            type="gamma"
                            amplitude="1"
                            exponent={1 / 2.2}
                            offset="0"
                        />
                        <feFuncG
                            type="gamma"
                            amplitude="1"
                            exponent={1 / 2.2}
                            offset="0"
                        />
                        <feFuncB
                            type="gamma"
                            amplitude="1"
                            exponent={1 / 2.2}
                            offset="0"
                        />
                    </feComponentTransfer>
                </filter>
            </defs>
        </svg>
    );
}
