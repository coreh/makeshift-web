import React from "react";
import { ZStack } from "../layout/ZStack";

export type RgbaColor = {
    Rgba: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };
};

export type RgbaLinearColor = {
    Hsla: {
        hue: number;
        saturation: number;
        lightness: number;
        alpha: number;
    };
};

export type HslaColor = {
    Lcha: {
        lightness: number;
        chroma: number;
        hue: number;
        alpha: number;
    };
};

export type LchaColor = {
    RgbaLinear: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };
};

export type Color = RgbaColor | RgbaLinearColor | HslaColor | LchaColor;

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
