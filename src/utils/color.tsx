export type RgbaColor = {
    Rgba: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };
};

export type RgbaLinearColor = {
    RgbaLinear: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };
};

export type HslaColor = {
    Hsla: {
        hue: number;
        saturation: number;
        lightness: number;
        alpha: number;
    };
};

export type LchaColor = {
    Lcha: {
        lightness: number;
        chroma: number;
        hue: number;
        alpha: number;
    };
};

export type Color = RgbaColor | RgbaLinearColor | HslaColor | LchaColor;

export namespace Color {
    export function rgba(
        red: number,
        green: number,
        blue: number,
        alpha: number,
    ): RgbaColor {
        return {
            Rgba: {
                red,
                green,
                blue,
                alpha,
            },
        };
    }

    export function rgbaLinear(
        red: number,
        green: number,
        blue: number,
        alpha: number,
    ): RgbaLinearColor {
        return {
            RgbaLinear: {
                red,
                green,
                blue,
                alpha,
            },
        };
    }

    export function hsla(
        hue: number,
        saturation: number,
        lightness: number,
        alpha: number,
    ): HslaColor {
        return {
            Hsla: {
                hue,
                saturation,
                lightness,
                alpha,
            },
        };
    }

    export function lcha(
        lightness: number,
        chroma: number,
        hue: number,
        alpha: number,
    ): LchaColor {
        return {
            Lcha: {
                lightness,
                chroma,
                hue,
                alpha,
            },
        };
    }

    export function toRgba(color: Color): RgbaColor {
        switch (true) {
            case "Rgba" in color: {
                return color;
            }
            case "RgbaLinear" in color: {
                const { red, green, blue, alpha } = color.RgbaLinear;
                return {
                    Rgba: {
                        red: linearToNonlinearSrgb(red),
                        green: linearToNonlinearSrgb(green),
                        blue: linearToNonlinearSrgb(blue),
                        alpha: alpha,
                    },
                };
            }
            case "Hsla" in color: {
                const [red, green, blue] = hslToNonlinearSrgb(
                    color.Hsla.hue,
                    color.Hsla.saturation,
                    color.Hsla.lightness,
                );
                const { alpha } = color.Hsla;
                return {
                    Rgba: {
                        red,
                        green,
                        blue,
                        alpha,
                    },
                };
            }
            case "Lcha" in color: {
                const [red, green, blue] = lchToNonlinearSrgb(
                    color.Lcha.lightness,
                    color.Lcha.chroma,
                    color.Lcha.hue,
                );
                const { alpha } = color.Lcha;
                return {
                    Rgba: {
                        red,
                        green,
                        blue,
                        alpha,
                    },
                };
            }
            default:
                throw new Error("Invalid color format");
        }
    }

    export function toRgbaLinear(color: Color): RgbaLinearColor {
        switch (true) {
            case "Rgba" in color: {
                const { red, green, blue, alpha } = color.Rgba;
                return {
                    RgbaLinear: {
                        red: nonlinearToLinearSrgb(red),
                        green: nonlinearToLinearSrgb(green),
                        blue: nonlinearToLinearSrgb(blue),
                        alpha: alpha,
                    },
                };
            }
            case "RgbaLinear" in color: {
                return color;
            }
            case "Hsla" in color: {
                const { hue, saturation, lightness, alpha } = color.Hsla;
                const [red, green, blue] = hslToNonlinearSrgb(
                    hue,
                    saturation,
                    lightness,
                );
                return {
                    RgbaLinear: {
                        red: nonlinearToLinearSrgb(red),
                        green: nonlinearToLinearSrgb(green),
                        blue: nonlinearToLinearSrgb(blue),
                        alpha,
                    },
                };
            }
            case "Lcha" in color: {
                const { lightness, chroma, hue, alpha } = color.Lcha;
                const [red, green, blue] = lchToNonlinearSrgb(
                    lightness,
                    chroma,
                    hue,
                );
                return {
                    RgbaLinear: {
                        red: nonlinearToLinearSrgb(red),
                        green: nonlinearToLinearSrgb(green),
                        blue: nonlinearToLinearSrgb(blue),
                        alpha,
                    },
                };
            }
            default:
                throw new Error("Invalid color format");
        }
    }

    export function toHsla(color: Color): HslaColor {
        switch (true) {
            case "Rgba" in color: {
                const [hue, saturation, lightness] = nonlinearSrgbToHsl(
                    color.Rgba.red,
                    color.Rgba.green,
                    color.Rgba.blue,
                );
                const { alpha } = color.Rgba;
                return {
                    Hsla: {
                        hue,
                        saturation,
                        lightness,
                        alpha,
                    },
                };
            }
            case "RgbaLinear" in color: {
                const { red, green, blue, alpha } = color.RgbaLinear;
                const [hue, saturation, lightness] = nonlinearSrgbToHsl(
                    linearToNonlinearSrgb(red),
                    linearToNonlinearSrgb(green),
                    linearToNonlinearSrgb(blue),
                );
                return {
                    Hsla: {
                        hue,
                        saturation,
                        lightness,
                        alpha,
                    },
                };
            }
            case "Hsla" in color: {
                return color;
            }
            case "Lcha" in color: {
                const { lightness, chroma, hue, alpha } = color.Lcha;
                const [red, green, blue] = lchToNonlinearSrgb(
                    lightness,
                    chroma,
                    hue,
                );
                const [hue_, saturation, lightness_] = nonlinearSrgbToHsl(
                    red,
                    green,
                    blue,
                );
                return {
                    Hsla: {
                        hue: hue_,
                        saturation,
                        lightness: lightness_,
                        alpha,
                    },
                };
            }
            default:
                throw new Error("Invalid color format");
        }
    }

    export function toLcha(color: Color): LchaColor {
        switch (true) {
            case "Rgba" in color: {
                const [lightness, chroma, hue] = nonlinearSrgbToLch([
                    color.Rgba.red,
                    color.Rgba.green,
                    color.Rgba.blue,
                ]);
                const { alpha } = color.Rgba;
                return {
                    Lcha: {
                        lightness,
                        chroma,
                        hue,
                        alpha,
                    },
                };
            }
            case "RgbaLinear" in color: {
                const { red, green, blue, alpha } = color.RgbaLinear;
                const [lightness, chroma, hue] = nonlinearSrgbToLch([
                    linearToNonlinearSrgb(red),
                    linearToNonlinearSrgb(green),
                    linearToNonlinearSrgb(blue),
                ]);
                return {
                    Lcha: {
                        lightness,
                        chroma,
                        hue,
                        alpha,
                    },
                };
            }
            case "Hsla" in color: {
                const { hue, saturation, lightness, alpha } = color.Hsla;
                const [red, green, blue] = hslToNonlinearSrgb(
                    hue,
                    saturation,
                    lightness,
                );
                const [lightness_, chroma, hue_] = nonlinearSrgbToLch([
                    red,
                    green,
                    blue,
                ]);
                return {
                    Lcha: {
                        lightness: lightness_,
                        chroma,
                        hue: hue_,
                        alpha,
                    },
                };
            }
            case "Lcha" in color: {
                return color;
            }
            default:
                throw new Error("Invalid color format");
        }
    }
}

// translated from https://github.com/bevyengine/bevy/blob/d8bd09ebe57021d61f1b2e3df5005d49bf6e329d/crates/bevy_render/src/color/colorspace.rs#L19
// source: https://entropymine.com/imageworsener/srgbformula/

export function linearToNonlinearSrgb(value: number): number {
    if (value <= 0.0) {
        return value;
    }

    if (value <= 0.0031308) {
        return value * 12.92; // linear falloff in dark values
    } else {
        return 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055; // gamma curve in other area
    }
}

export function nonlinearToLinearSrgb(value: number): number {
    if (value <= 0.0) {
        return value;
    }
    if (value <= 0.04045) {
        return value / 12.92; // linear falloff in dark values
    } else {
        return Math.pow((value + 0.055) / 1.055, 2.4); // gamma curve in other area
    }
}

export function hslToNonlinearSrgb(
    hue: number,
    saturation: number,
    lightness: number,
): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
    const chroma = (1.0 - Math.abs(2.0 * lightness - 1.0)) * saturation;
    const huePrime = hue / 60.0;
    const largestComponent = chroma * (1.0 - Math.abs((huePrime % 2.0) - 1.0));
    let rTemp, gTemp, bTemp;
    if (huePrime < 1.0) {
        rTemp = chroma;
        gTemp = largestComponent;
        bTemp = 0.0;
    } else if (huePrime < 2.0) {
        rTemp = largestComponent;
        gTemp = chroma;
        bTemp = 0.0;
    } else if (huePrime < 3.0) {
        rTemp = 0.0;
        gTemp = chroma;
        bTemp = largestComponent;
    } else if (huePrime < 4.0) {
        rTemp = 0.0;
        gTemp = largestComponent;
        bTemp = chroma;
    } else if (huePrime < 5.0) {
        rTemp = largestComponent;
        gTemp = 0.0;
        bTemp = chroma;
    } else {
        rTemp = chroma;
        gTemp = 0.0;
        bTemp = largestComponent;
    }
    const lightnessMatch = lightness - chroma / 2.0;

    return [
        rTemp + lightnessMatch,
        gTemp + lightnessMatch,
        bTemp + lightnessMatch,
    ];
}

export function nonlinearSrgbToHsl(
    red: number,
    green: number,
    blue: number,
): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
    const xMax = Math.max(red, green, blue);
    const xMin = Math.min(red, green, blue);
    const chroma = xMax - xMin;
    const lightness = (xMax + xMin) / 2.0;
    let hue;
    if (chroma === 0.0) {
        hue = 0.0;
    } else if (red === xMax) {
        hue = (60.0 * (green - blue)) / chroma;
    } else if (green === xMax) {
        hue = 60.0 * (2.0 + (blue - red) / chroma);
    } else {
        hue = 60.0 * (4.0 + (red - green) / chroma);
    }
    hue = hue < 0.0 ? 360.0 + hue : hue;
    const saturation =
        lightness <= 0.0 || lightness >= 1.0
            ? 0.0
            : (xMax - lightness) / Math.min(lightness, 1.0 - lightness);

    return [hue, saturation, lightness];
}

// References available at http://brucelindbloom.com/ in the "Math" section

// CIE Constants
// http://brucelindbloom.com/index.html?LContinuity.html (16) (17)
const CIE_EPSILON: number = 216.0 / 24389.0;
const CIE_KAPPA: number = 24389.0 / 27.0;
// D65 White Reference:
// https://en.wikipedia.org/wiki/Illuminant_D65#Definition
const D65_WHITE_X: number = 0.95047;
const D65_WHITE_Y: number = 1.0;
const D65_WHITE_Z: number = 1.08883;

export function lchToNonlinearSrgb(
    lightness: number,
    chroma: number,
    hue: number,
): [number, number, number] {
    const lightness_ = lightness * 100.0;
    const chroma_ = chroma * 100.0;

    // convert LCH to Lab
    // http://www.brucelindbloom.com/index.html?Eqn_LCH_to_Lab.html
    const l = lightness_;
    const a = chroma_ * Math.cos(hue * (Math.PI / 180));
    const b = chroma_ * Math.sin(hue * (Math.PI / 180));

    // convert Lab to XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_Lab_to_XYZ.html
    const fy = (l + 16.0) / 116.0;
    const fx = a / 500.0 + fy;
    const fz = fy - b / 200.0;

    let xr;
    const fx3 = Math.pow(fx, 3.0);

    if (fx3 > CIE_EPSILON) {
        xr = fx3;
    } else {
        xr = (116.0 * fx - 16.0) / CIE_KAPPA;
    }
    const yr =
        l > CIE_EPSILON * CIE_KAPPA
            ? Math.pow((l + 16.0) / 116.0, 3.0)
            : l / CIE_KAPPA;
    let zr;
    const fz3 = Math.pow(fz, 3.0);

    if (fz3 > CIE_EPSILON) {
        zr = fz3;
    } else {
        zr = (116.0 * fz - 16.0) / CIE_KAPPA;
    }
    const x = xr * D65_WHITE_X;
    const y = yr * D65_WHITE_Y;
    const z = zr * D65_WHITE_Z;

    // XYZ to sRGB
    // http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_RGB.html
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html (sRGB, XYZ to RGB [M]-1)
    const red = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
    const green = x * -0.969266 + y * 1.8760108 + z * 0.041556;
    const blue = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

    return [
        Math.max(0.0, Math.min(linearToNonlinearSrgb(red), 1.0)),
        Math.max(0.0, Math.min(linearToNonlinearSrgb(green), 1.0)),
        Math.max(0.0, Math.min(linearToNonlinearSrgb(blue), 1.0)),
    ];
}

export function nonlinearSrgbToLch([red, green, blue]: number[]): [
    number,
    number,
    number,
] {
    // RGB to XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_to_XYZ.html
    const red_ = nonlinearToLinearSrgb(red);
    const green_ = nonlinearToLinearSrgb(green);
    const blue_ = nonlinearToLinearSrgb(blue);

    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html (sRGB, RGB to XYZ [M])
    const x = red_ * 0.4124564 + green_ * 0.3575761 + blue_ * 0.1804375;
    const y = red_ * 0.2126729 + green_ * 0.7151522 + blue_ * 0.072175;
    const z = red_ * 0.0193339 + green_ * 0.119192 + blue_ * 0.9503041;

    // XYZ to Lab
    // http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_Lab.html
    const xr = x / D65_WHITE_X;
    const yr = y / D65_WHITE_Y;
    const zr = z / D65_WHITE_Z;
    const fx =
        xr > CIE_EPSILON ? Math.cbrt(xr) : (CIE_KAPPA * xr + 16.0) / 116.0;
    const fy =
        yr > CIE_EPSILON ? Math.cbrt(yr) : (CIE_KAPPA * yr + 16.0) / 116.0;
    const fz =
        yr > CIE_EPSILON ? Math.cbrt(zr) : (CIE_KAPPA * zr + 16.0) / 116.0;
    const l = 116.0 * fy - 16.0;
    const a = 500.0 * (fx - fy);
    const b = 200.0 * (fy - fz);

    // Lab to LCH
    // http://www.brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
    const c = Math.sqrt(Math.pow(a, 2.0) + Math.pow(b, 2.0));
    let h = Math.atan2(b, a) * (180 / Math.PI);

    if (h < 0.0) {
        h += 360.0;
    }

    return [
        Math.max(0.0, Math.min(l / 100.0, 1.5)),
        Math.max(0.0, Math.min(c / 100.0, 1.5)),
        h,
    ];
}
