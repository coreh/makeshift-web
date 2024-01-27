import React from "react";
import { Color } from "../../utils/color";
import { HStack } from "../layout/HStack";

export interface HDRIntensitySwatchesProps {
    value: Color;
    onChange?: (value: Color) => void;
}

export function HDRIntensitySwatches(props: HDRIntensitySwatchesProps) {
    const { value, onChange } = props;

    return (
        <div className="HDRIntensitySwatches">
            <div className="Wrapper">
                {[-2, -1, 0, 1, 2].map((i) => {
                    const [color, intensity] = Color.extractHdrIntensity(value);
                    const {
                        RgbaLinear: { red, green, blue },
                    } = Color.injectHdrIntensity(color, intensity + i);
                    const {
                        RgbaLinear: {
                            red: glowRed,
                            green: glowGreen,
                            blue: glowBlue,
                        },
                    } = Color.injectHdrIntensity(color, intensity + i - 2.0);

                    return (
                        <div
                            className="Swatch"
                            key={i}
                            onClick={() => handleClick(i)}
                            style={{
                                backgroundColor: `color(srgb-linear ${red} ${green} ${blue})`,
                                boxShadow: `0 0 50px color(srgb-linear ${glowRed} ${glowGreen} ${glowBlue} / ${Math.min(0.25, intensity + i - 2.0)})`,
                                color:
                                    intensity + i > -0.25 ? "black" : "white",
                            }}
                        >
                            <div className="Label">
                                {i > 0 ? "+" : ""}
                                {i}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    function handleClick(i: number) {
        const [color, intensity] = Color.extractHdrIntensity(value);
        onChange?.(Color.injectHdrIntensity(color, intensity + i));
    }
}
