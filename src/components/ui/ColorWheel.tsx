import React from "react";
import { ZStack } from "../layout/ZStack";
import { Color } from "../../utils/color";

export interface ColorWheelProps {
    value?: Color;
    onChange?: (value: string) => void;
}

export function ColorWheel(props: ColorWheelProps) {
    const { value, onChange } = props;

    return (
        <div className="ColorWheel">
            <ZStack grow={1}>
                <div className="HueGradient">
                    <div className="Handle Hue" />
                </div>
                <div className="SaturationGradient" />
                <div className="LightnessGradient">
                    <div className="Handle SaturationLightness" />
                </div>
            </ZStack>
        </div>
    );
}
