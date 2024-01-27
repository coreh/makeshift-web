import React, { useId } from "react";
import { ZStack } from "../layout/ZStack";
import { Color } from "../../utils/color";

export interface ColorWheelProps {
    value?: Color;
    linearColorspace?: boolean;
    onChange?: (value: string) => void;
}

export function ColorWheel(props: ColorWheelProps) {
    const svgFilterId = useId();
    const {
        value = Color.rgba(1, 1, 1, 1),
        onChange,
        linearColorspace,
    } = props;

    const sdrSafeValue = Color.sdrSafe(value);
    const {
        Rgba: { red, green, blue },
    } = Color.toRgba(sdrSafeValue);

    const {
        Hsla: { hue, saturation, lightness },
    } = Color.toHsla(sdrSafeValue);

    const hueX = Math.sin((hue / 180) * Math.PI);
    const hueY = -Math.cos((hue / 180) * Math.PI);

    return (
        <div className="ColorWheel">
            <ZStack grow={1}>
                {linearColorspace && <SVGFilter id={svgFilterId} />}
                <div className="Wheel HueGradient" />
                <div className="Wheel">
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
                    className="Box"
                    style={{
                        filter: linearColorspace
                            ? `url('#${svgFilterId}')`
                            : undefined,
                    }}
                >
                    <div style={{ background: `hsl(${hue}, 100%, 50%)` }} />
                    <div className="SaturationGradient" />
                    <div className="LightnessGradient" />
                    <div
                        className="Handle SaturationLightness"
                        style={{
                            top: `${100 - lightness * 100}%`,
                            left: `${saturation * 100}%`,
                            background: `color(srgb ${red} ${green} ${blue})`,
                        }}
                    />
                </div>
            </ZStack>
        </div>
    );
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
