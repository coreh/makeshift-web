import React, {
    createElement,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { useGlobalStore } from "./store";
import useSWR from "swr";
import { Unserializable, deserialize, serialize } from "./utils";
import { fetcher } from ".";
import { Button } from "./components/ui/Button";
import { VStack } from "./components/layout/VStack";
import { HStack } from "./components/layout/HStack";
import cn from "classnames";
import * as Lucide from "lucide-react";
import { TextInput } from "./components/ui/Input";
import { Trackball } from "./components/ui/Trackball";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "./components/ui/Select";
import { Checkbox } from "./components/ui/Checkbox";
import { Topic, TopicName } from "./components/ui/common";
import { ColorWheel } from "./components/ui/ColorWheel";
import { Color } from "./utils/color";
import { HDRIntensitySwatches } from "./components/ui/HDRIntensitySwatches";

export function Inspector() {
    const globalStore = useGlobalStore();

    const { data, isLoading, error } = useSWR(
        globalStore.selection.count() === 1
            ? {
                  request: "GET",
                  params: {
                      entity: globalStore.selection.first(),
                      data: {
                          components: ["*"],
                      },
                  },
              }
            : null,
        { keepPreviousData: true },
    );

    const components = data?.content?.entity?.components;

    const componentEntries = Object.entries(components ?? {})
        .map(([name, component]) => {
            return [name, deserialize(component as any)];
        })
        .sort(([nameA, componentA], [nameB, componentB]) => {
            const priorityA = getComponentSortingPriority(nameA, componentA);
            const priorityB = getComponentSortingPriority(nameB, componentB);

            if (priorityA === priorityB) {
                return nameA.localeCompare(nameB);
            }

            return priorityA - priorityB;
        });

    return (
        <div className="Inspector">
            {components &&
                componentEntries.map(([name, component]) => {
                    return (
                        <ComponentInspector
                            key={name}
                            name={name}
                            component={component}
                        />
                    );
                })}
        </div>
    );
}

interface ComponentInspectorProps {
    name: string;
    component: any;
}

export function ComponentInspector({
    name,
    component,
}: ComponentInspectorProps) {
    const globalStore = useGlobalStore();

    const { topic, Icon, label, ComponentEditor } = getComponentInfo(
        name,
        component,
    );

    const prettyName = prettifyName(name);

    return (
        <div className="ComponentInspector">
            <div className="Heading">
                <div
                    className={cn(
                        "EntityIcon",
                        topic != null && `topic:${topic}`,
                    )}
                >
                    <Icon />
                </div>
                <span title={name}>{prettyName}</span>
                {label && <i style={{ color: "var(--accent)" }}>{label}</i>}
            </div>
            {ComponentEditor && (
                <div className="Content">
                    <ComponentEditor
                        name={name}
                        component={component}
                        onSave={handleSave}
                    />
                </div>
            )}
        </div>
    );

    function handleSave(name: string, component: any) {
        fetcher({
            request: "INSERT",
            params: {
                entity: globalStore.selection.first(),
                components: {
                    [name]: serialize(component),
                },
            },
        });
    }
}

interface ComponentEditorProps {
    name: string;
    component: any;
    onSave: (name: string, component: any) => void;
}

function getComponentSortingPriority(name: string, component: any) {
    const { label, ComponentEditor } = getComponentInfo(name, component);

    if (label === "Marker") {
        return -10;
    }

    if (label === "Unserializable") {
        return 100;
    }

    if (label === "Computed") {
        return 20;
    }

    if (ComponentEditor === GenericComponentEditor) {
        return 30;
    }

    switch (name) {
        case "bevy_transform::components::transform::Transform":
            return -100;
        case "bevy_render::view::visibility::Visibility":
            return -90;
    }

    return 0;
}

function getComponentInfo(name: string, component: any) {
    let topic;
    let label;
    let Icon: React.FC<{}> = Lucide.ToyBrick;
    let ComponentEditor: React.FC<ComponentEditorProps> | undefined;

    switch (name) {
        case "bevy_hierarchy::components::children::Children":
            Icon = Lucide.ListTree;
            label = "Hierarchy";
            break;
        case "bevy_hierarchy::components::parent::Parent":
            Icon = Lucide.CornerLeftUp;
            label = "Hierarchy";
            break;
        case "bevy_render::view::visibility::InheritedVisibility":
        case "bevy_render::view::visibility::ViewVisibility":
        case "bevy_transform::components::global_transform::GlobalTransform":
        case "bevy_render::primitives::CascadesFrusta":
        case "bevy_pbr::light::Cascades":
        case "bevy_pbr::bundle::CascadesVisibleEntities":
        case "bevy_ui::measurement::ContentSize":
        case "bevy_ui::widget::text::TextFlags":
        case "bevy_text::pipeline::TextLayoutInfo":
        case "bevy_ui::ui_node::Node":
        case "bevy_window::window::Window":
        case "bevy_render::camera::camera::Camera":
        case "bevy_render::view::visibility::VisibleEntities":
        case "bevy_render::primitives::Frustum":
        case "bevy_render::primitives::Aabb":
            topic = "code";
            Icon = Lucide.ArrowBigRightDash;
            label = "Computed";
            break;
        case "bevy_window::window::PrimaryWindow":
        case "bevy_pbr::light::NotShadowCaster":
        case "bevy_pbr::light::NotShadowReceiver":
        case "bevy_pbr::light::TransmittedShadowReceiver":
            Icon = Lucide.Tag;
            label = "Marker";
            break;
        case "bevy_render::view::visibility::Visibility":
            Icon = Lucide.Eye;
            ComponentEditor = VisibilityComponentEditor;
            break;
        case "bevy_ui::focus::FocusPolicy":
            Icon = Lucide.Focus;
            ComponentEditor = FocusPolicyComponentEditor;
            break;
        case "bevy_core_pipeline::tonemapping::DebandDither":
            Icon = Lucide.Grip;
            ComponentEditor = DebandDitherComponentEditor;
            break;
        case "bevy_core_pipeline::tonemapping::Tonemapping":
            Icon = Lucide.Blend;
            ComponentEditor = TonemappingComponentEditor;
            break;
        case "bevy_transform::components::transform::Transform":
            Icon = Lucide.Move3D;
            ComponentEditor = TransformComponentEditor;
            break;
        case "bevy_pbr::light::PointLight":
            topic = "light";
            Icon = Lucide.Lightbulb;
            ComponentEditor = PointLightComponentEditor;
            break;
        case "bevy_pbr::light::DirectionalLight":
            topic = "light";
            Icon = Lucide.Sunset;
            ComponentEditor = DirectionalLightComponentEditor;
            break;
        case "bevy_pbr::light::SpotLight":
            topic = "light";
            Icon = Lucide.LampDesk;
            ComponentEditor = SpotLightComponentEditor;
            break;
        default:
            if (component === Unserializable) {
                topic = "code";
                Icon = Lucide.Binary;
                label = "Unserializable";
            } else {
                ComponentEditor = GenericComponentEditor;
            }
            break;
    }

    return {
        topic,
        label,
        Icon,
        ComponentEditor,
    };
}

export function GenericComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const stringified = JSON.stringify(props.component, null, 4);
    const [text, setText] = useState("");
    useEffect(() => {
        setText(stringified);
    }, [entity, stringified]);
    return (
        <div className="ComponentEditor">
            <VStack>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <HStack>
                    <Button onClick={() => setText(stringified)}>
                        <Lucide.Undo2 />
                        Revert
                    </Button>
                    <Button
                        primary
                        onClick={() =>
                            props.onSave(props.name, JSON.parse(text))
                        }
                    >
                        <Lucide.Check />
                        Save
                    </Button>
                </HStack>
            </VStack>
        </div>
    );
}

export function UnserializableComponentEditor(props: ComponentEditorProps) {
    return (
        <div className="ComponentEditor topic:warning">
            <Lucide.PlugZap />
            Unserializable
        </div>
    );
}

export function TransformComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const [x, setX] = useState("");
    const [y, setY] = useState("");
    const [z, setZ] = useState("");
    const [sx, setSX] = useState("");
    const [sy, setSY] = useState("");
    const [sz, setSZ] = useState("");
    const [rx, setRX] = useState("");
    const [ry, setRY] = useState("");
    const [rz, setRZ] = useState("");
    const [rw, setRW] = useState("");
    const userInteraction = useRef(false);

    useEffect(() => {
        setX(`${props.component.translation.x}`);
        setY(`${props.component.translation.y}`);
        setZ(`${props.component.translation.z}`);
        setSX(`${props.component.scale.x}`);
        setSY(`${props.component.scale.y}`);
        setSZ(`${props.component.scale.z}`);
        setRX(`${props.component.rotation.x}`);
        setRY(`${props.component.rotation.y}`);
        setRZ(`${props.component.rotation.z}`);
        setRW(`${props.component.rotation.w}`);
    }, [entity, props.component]);

    useEffect(() => {
        if (!userInteraction.current) {
            return;
        }

        userInteraction.current = false;

        let numberX = parseFloat(x);
        let numberY = parseFloat(y);
        let numberZ = parseFloat(z);
        let numberSX = parseFloat(sx);
        let numberSY = parseFloat(sy);
        let numberSZ = parseFloat(sz);
        let numberRX = parseFloat(rx);
        let numberRY = parseFloat(ry);
        let numberRZ = parseFloat(rz);
        let numberRW = parseFloat(rw);

        if (
            !Number.isNaN(numberX) &&
            !Number.isNaN(numberY) &&
            !Number.isNaN(numberZ) &&
            !Number.isNaN(numberSX) &&
            !Number.isNaN(numberSY) &&
            !Number.isNaN(numberSZ) &&
            !Number.isNaN(numberRX) &&
            !Number.isNaN(numberRY) &&
            !Number.isNaN(numberRZ) &&
            !Number.isNaN(numberRW)
        ) {
            props.onSave(props.name, {
                translation: {
                    x: numberX,
                    y: numberY,
                    z: numberZ,
                },
                scale: {
                    x: numberSX,
                    y: numberSY,
                    z: numberSZ,
                },
                rotation: {
                    x: numberRX,
                    y: numberRY,
                    z: numberRZ,
                    w: numberRW,
                },
            });
        }
    }, [x, y, z, sx, sy, sz, rx, ry, rz, rw]);

    return (
        <div className="ComponentEditor">
            <HStack>
                <VStack grow={1}>
                    <label>Translation</label>
                    <TextInput
                        label="X"
                        value={x}
                        onSave={(value) => handleChange(value, setX)}
                    />
                    <TextInput
                        label="Y"
                        value={y}
                        onSave={(value) => handleChange(value, setY)}
                    />
                    <TextInput
                        label="Z"
                        value={z}
                        onSave={(value) => handleChange(value, setZ)}
                    />
                </VStack>
                <VStack grow={1}>
                    <label>Scale</label>
                    <TextInput
                        label="SX"
                        value={sx}
                        onSave={(value) => handleChange(value, setSX)}
                    />
                    <TextInput
                        label="SY"
                        value={sy}
                        onSave={(value) => handleChange(value, setSY)}
                    />
                    <TextInput
                        label="SZ"
                        value={sz}
                        onSave={(value) => handleChange(value, setSZ)}
                    />
                </VStack>
            </HStack>
            <VStack>
                <label>Rotation</label>
                <HStack>
                    <VStack grow={1}>
                        <TextInput
                            label="RX"
                            value={rx}
                            onSave={(value) => handleChange(value, setRX)}
                        />
                        <TextInput
                            label="RY"
                            value={ry}
                            onSave={(value) => handleChange(value, setRY)}
                        />
                        <TextInput
                            label="RZ"
                            value={rz}
                            onSave={(value) => handleChange(value, setRZ)}
                        />
                        <TextInput
                            label="RW"
                            value={rw}
                            onSave={(value) => handleChange(value, setRW)}
                        />
                    </VStack>
                    <Trackball
                        x={parseFloat(rx)}
                        y={parseFloat(ry)}
                        z={parseFloat(rz)}
                        w={parseFloat(rw)}
                        onSave={(rx, ry, rz, rw) => {
                            handleChange(rx.toString().slice(0, 9), setRX);
                            handleChange(ry.toString().slice(0, 9), setRY);
                            handleChange(rz.toString().slice(0, 9), setRZ);
                            handleChange(rw.toString().slice(0, 9), setRW);
                        }}
                    />
                </HStack>
            </VStack>
        </div>
    );

    function handleChange(value: string, setter: (value: string) => void) {
        userInteraction.current = true;
        setter(value);
    }
}

const FocusPolicyComponentEditor = makeMultipleChoiceComponentEditor(
    "Focus Policy",
    [
        {
            value: "Pass",
            Icon: Lucide.LogIn,
            label: () => (
                <dl>
                    <dt>Pass</dt>
                    <dd>Lets interaction pass through to child nodes</dd>
                </dl>
            ),
        },
        {
            value: "Block",
            Icon: Lucide.Ban,
            label: () => (
                <dl>
                    <dt>Block</dt>
                    <dd>Blocks interaction with child nodes</dd>
                </dl>
            ),
        },
    ],
);

const DebandDitherComponentEditor = makeMultipleChoiceComponentEditor(
    "Deband Dither",
    [
        {
            value: "Enabled",
            Icon: () => (
                <img
                    className="Thumbnail"
                    width={30}
                    src="/images/debanddither_enabled.png"
                />
            ),
            label: () => (
                <dl>
                    <dt>Enabled</dt>
                    <dd>
                        Applies dithering to mitigate color banding in the final
                        image
                    </dd>
                </dl>
            ),
        },
        {
            value: "Disabled",
            Icon: () => (
                <img
                    className="Thumbnail"
                    width={30}
                    src="/images/debanddither_disabled.png"
                />
            ),
            label: () => (
                <dl>
                    <dt>Disabled</dt>
                    <dd>
                        Keep colors as they are, but risk color banding in the
                        final image
                    </dd>
                </dl>
            ),
        },
    ],
);

const VisibilityComponentEditor = makeMultipleChoiceComponentEditor(
    "Visibility",
    [
        { value: "Inherited", Icon: Lucide.CornerLeftUp },
        { value: "Visible", Icon: Lucide.Eye },
        { value: "Hidden", Icon: Lucide.EyeOff },
    ],
);

const TonemappingComponentEditor = makeMultipleChoiceComponentEditor(
    "Tonemapping",
    [
        {
            value: "None",
            label: () => (
                <dl>
                    <dt>None</dt>
                    <dd>Disables tonemapping. Not Recommended.</dd>
                </dl>
            ),
            Icon: () => <img className="Thumbnail" src="/images/tm_none.png" />,
        },
        {
            value: "Reinhard",
            label: () => (
                <dl>
                    <dt>Reinhard</dt>
                    <dd>
                        Suffers from lots hue shifting, brights don't desaturate
                        naturally. Bright primaries and secondaries don't
                        desaturate at all.
                    </dd>
                </dl>
            ),
            Icon: () => (
                <img className="Thumbnail" src="/images/tm_reinhard.png" />
            ),
        },
        {
            value: "ReinhardLuminance",
            label: () => (
                <dl>
                    <dt>Reinhard Luminance</dt>
                    <dd>
                        Suffers from hue shifting. Brights don't desaturate much
                        at all across the spectrum.
                    </dd>
                </dl>
            ),
            Icon: () => (
                <img
                    className="Thumbnail"
                    src="/images/tm_reinhard_luminance.png"
                />
            ),
        },
        {
            value: "AcesFitted",
            label: () => (
                <dl>
                    <dt>ACES Fitted</dt>
                    <dd>
                        Not neutral, has a very specific aesthetic, intentional
                        and dramatic hue shifting. Bright greens and reds turn
                        orange. Bright blues turn magenta. Significantly
                        increased contrast. Brights desaturate across the
                        spectrum.
                    </dd>
                </dl>
            ),
            Icon: () => <img className="Thumbnail" src="/images/tm_aces.png" />,
        },
        {
            value: "AgX",
            label: () => (
                <dl>
                    <dt>AgX</dt>
                    <dd>
                        Very neutral. Image is somewhat desaturated when
                        compared to other tonemappers. Little to no hue
                        shifting. Subtle{" "}
                        <a
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            target="_blank"
                            href="https://en.wikipedia.org/wiki/Abney_effect"
                        >
                            Abney shifting
                        </a>
                        .
                    </dd>
                </dl>
            ),
            Icon: () => <img className="Thumbnail" src="/images/tm_agx.png" />,
        },
        {
            value: "SomewhatBoringDisplayTransform",
            label: () => (
                <dl>
                    <dt>Somewhat Boring Display Transform</dt>
                    <dd>
                        Has little hue shifting in the darks and mids, but lots
                        in the brights. Brights desaturate across the spectrum.
                        Is sort of between Reinhard and ReinhardLuminance.
                        Conceptually similar to reinhard-jodie. Designed as a
                        compromise if you want e.g. decent skin tones in low
                        light, but can't afford to re-do your VFX to look good
                        without hue shifting.
                    </dd>
                </dl>
            ),
            Icon: () => <img className="Thumbnail" src="/images/tm_sbdt.png" />,
        },
        {
            value: "TonyMcMapface",
            label: () => (
                <dl>
                    <dt>Tony McMapface</dt>
                    <dd>
                        Very neutral. Subtle but intentional hue shifting.
                        Brights desaturate across the spectrum.
                    </dd>
                </dl>
            ),
            Icon: () => (
                <img className="Thumbnail" src="/images/tm_tonymcmapface.png" />
            ),
        },
        {
            value: "BlenderFilmic",
            label: () => (
                <dl>
                    <dt>Blender Filmic</dt>
                    <dd>
                        Somewhat neutral. Suffers from hue shifting. Brights
                        desaturate across the spectrum.
                    </dd>
                </dl>
            ),
            Icon: () => (
                <img
                    className="Thumbnail"
                    src="/images/tm_blender_filmic.png"
                />
            ),
        },
    ],
);

function BooleanComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const [value, setValue] = useState(false);

    useEffect(() => {
        setValue(props.component);
    }, [entity, props.component]);

    return (
        <div className="ComponentEditor">
            <Checkbox
                label={prettifyName(props.name)}
                checked={value}
                onChange={(checked) => {
                    props.onSave(props.name, checked);
                    setValue(checked);
                }}
            />
        </div>
    );
}

function NumberComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const [value, setValue] = useState("");
    const userInteraction = useRef(false);

    useEffect(() => {
        setValue(`${props.component}`);
    }, [entity, props.component]);

    useEffect(() => {
        if (!userInteraction.current) {
            return;
        }

        userInteraction.current = false;

        let number = parseFloat(value);

        if (!Number.isNaN(number)) {
            props.onSave(props.name, number);
        }
    }, [value]);

    return (
        <div className="ComponentEditor">
            <TextInput
                label={prettifyName(props.name)}
                value={value}
                onSave={(value) => {
                    userInteraction.current = true;
                    setValue(value);
                }}
            />
        </div>
    );
}

const COLOR_ROUND_PRECISION = 100_000;

function ColorComponentEditor(props: ComponentEditorProps) {
    const { name, component, onSave } = props;
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const [value, setValue] = useState<Color>(props.component);
    const [intensity, setIntensity] = useState<number>(0);
    const hasCalculatedIntensity = useRef(false);

    useEffect(() => {
        hasCalculatedIntensity.current = false;
    }, [entity]);

    useEffect(() => {
        if ("RgbaLinear" in component) {
            if (!hasCalculatedIntensity.current) {
                hasCalculatedIntensity.current = true;
                const [extractedValue, extractedIntensity] =
                    Color.extractHdrIntensity(component);
                setValue(
                    Color.roundPrecision(extractedValue, COLOR_ROUND_PRECISION),
                );
                setIntensity(
                    Math.round(extractedIntensity * COLOR_ROUND_PRECISION) /
                        COLOR_ROUND_PRECISION,
                );
            } else {
                setValue(
                    Color.roundPrecision(
                        Color.atHdrIntensity(component, intensity),
                        COLOR_ROUND_PRECISION,
                    ),
                );
            }
        } else {
            setValue(component);
            setIntensity(0);
        }
    }, [entity, props.component]);

    let colorSpace: "Rgba" | "RgbaLinear" | "Hsla" | "Lcha";
    let red: number = 0,
        green: number = 0,
        blue: number = 0,
        alpha: number = 0,
        hue: number = 0,
        saturation: number = 0,
        lightness: number = 0,
        chroma: number = 0;

    switch (true) {
        case "Rgba" in value:
            colorSpace = "Rgba";
            ({
                Rgba: { red, green, blue, alpha },
            } = value);
            break;
        case "RgbaLinear" in value:
            colorSpace = "RgbaLinear";
            ({
                RgbaLinear: { red, green, blue, alpha },
            } = value);
            break;
        case "Hsla" in value:
            colorSpace = "Hsla";
            ({
                Hsla: { hue, saturation, lightness, alpha },
            } = value);
            break;
        case "Lcha" in value:
            colorSpace = "Lcha";
            ({
                Lcha: { lightness, chroma, hue, alpha },
            } = value);
            break;
        default:
            throw new Error(`Unknown color space`);
    }

    return (
        <div className="ComponentEditor">
            <Select value={colorSpace} onValueChange={handleColorSpaceChange}>
                <SelectTrigger>
                    <label>Color Space</label>
                    <SelectValue placeholder="Color Mode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="Rgba">Rgba</SelectItem>
                        <SelectItem value="RgbaLinear">RgbaLinear</SelectItem>
                        <SelectItem value="Hsla">Hsla</SelectItem>
                        <SelectItem value="Lcha">Lcha</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <ColorWheel
                value={value}
                linearColorspace={colorSpace === "RgbaLinear"}
                onChange={handleWheelChange}
            />
            {(colorSpace === "Rgba" || colorSpace === "RgbaLinear") && (
                <HStack>
                    <VStack grow={1}>
                        <Topic topic="x">
                            <NumberComponentEditor
                                name="red"
                                component={red}
                                onSave={handleChannelSave}
                            />
                        </Topic>
                        <Topic topic="y">
                            <NumberComponentEditor
                                name="green"
                                component={green}
                                onSave={handleChannelSave}
                            />
                        </Topic>
                    </VStack>
                    <VStack grow={1}>
                        <Topic topic="z">
                            <NumberComponentEditor
                                name="blue"
                                component={blue}
                                onSave={handleChannelSave}
                            />
                        </Topic>
                        <NumberComponentEditor
                            name="alpha"
                            component={alpha}
                            onSave={handleChannelSave}
                        />
                    </VStack>
                </HStack>
            )}
            {(colorSpace === "Hsla" || colorSpace === "Lcha") && (
                <HStack>
                    <VStack grow={1}>
                        <NumberComponentEditor
                            name="hue"
                            component={hue}
                            onSave={handleChannelSave}
                        />
                        {colorSpace === "Lcha" && (
                            <NumberComponentEditor
                                name="chroma"
                                component={chroma}
                                onSave={handleChannelSave}
                            />
                        )}
                        {colorSpace === "Hsla" && (
                            <NumberComponentEditor
                                name="saturation"
                                component={saturation}
                                onSave={handleChannelSave}
                            />
                        )}
                    </VStack>
                    <VStack grow={1}>
                        <NumberComponentEditor
                            name="lightness"
                            component={lightness}
                            onSave={handleChannelSave}
                        />
                        <NumberComponentEditor
                            name="alpha"
                            component={alpha}
                            onSave={handleChannelSave}
                        />
                    </VStack>
                </HStack>
            )}
            {colorSpace === "RgbaLinear" && (
                <VStack>
                    <HStack>
                        <NumberComponentEditor
                            name="HDR Intensity (×2ⁿ)"
                            component={intensity}
                            onSave={handleIntensitySave}
                        />
                        <Button
                            disabled={red == 1 || green == 1 || blue == 1}
                            onClick={handleIntensityRecalculate}
                        >
                            <Lucide.Aperture />
                        </Button>
                    </HStack>
                    <HDRIntensitySwatches
                        value={component}
                        onChange={handleIntensitySwatchChange}
                    />
                </VStack>
            )}
        </div>
    );

    function handleChannelSave(nestedName: string, nestedComponent: number) {
        let result;
        switch (colorSpace) {
            case "Rgba":
                result = {
                    Rgba: {
                        red,
                        green,
                        blue,
                        alpha,
                        [nestedName]: nestedComponent,
                    },
                };
                break;
            case "RgbaLinear":
                result = {
                    RgbaLinear: {
                        red,
                        green,
                        blue,
                        alpha,
                        [nestedName]: nestedComponent,
                    },
                };
                result = Color.roundPrecision(
                    Color.toRhsColorspace(
                        Color.injectHdrIntensity(result, intensity),
                        value,
                    ),
                    COLOR_ROUND_PRECISION,
                );
                break;
            case "Hsla":
                result = {
                    Hsla: {
                        hue,
                        saturation,
                        lightness,
                        alpha,
                        [nestedName]: nestedComponent,
                    },
                };
                break;
            case "Lcha":
                result = {
                    Lcha: {
                        lightness,
                        chroma,
                        hue,
                        alpha,
                        [nestedName]: nestedComponent,
                    },
                };
                break;
            default:
                throw new Error(`Unknown color space`);
        }
        setValue(result);
        onSave(name, result);
    }

    function handleColorSpaceChange(colorSpace: string) {
        let result;
        switch (colorSpace) {
            case "Rgba":
                result = Color.toRgba(value);
                break;
            case "RgbaLinear":
                result = Color.toRgbaLinear(value);
                break;
            case "Hsla":
                result = Color.toHsla(value);
                break;
            case "Lcha":
                result = Color.toLcha(value);
                break;
            default:
                throw new Error(`Unknown color space`);
        }
        result = Color.roundPrecision(result, COLOR_ROUND_PRECISION);
        onSave(name, result);
    }

    function handleIntensitySave(_nestedName: string, intensity: number) {
        const updatedValue = Color.roundPrecision(
            Color.injectHdrIntensity(value, intensity),
            COLOR_ROUND_PRECISION,
        );
        setValue(updatedValue);
        setIntensity(intensity);
        onSave(name, updatedValue);
    }

    function handleIntensitySwatchChange(color: Color) {
        const [extractedValue, extractedIntensity] =
            Color.extractHdrIntensity(color);
        setValue(extractedValue);
        setIntensity(
            Math.round(extractedIntensity * COLOR_ROUND_PRECISION) /
                COLOR_ROUND_PRECISION,
        );
        let result = Color.toRhsColorspace(color, value);
        result = Color.roundPrecision(result, COLOR_ROUND_PRECISION);
        onSave(name, result);
    }

    function handleIntensityRecalculate() {
        const [extractedValue, extractedIntensity] =
            Color.extractHdrIntensity(component);
        setValue(Color.roundPrecision(extractedValue, COLOR_ROUND_PRECISION));
        setIntensity(
            Math.round(extractedIntensity * COLOR_ROUND_PRECISION) /
                COLOR_ROUND_PRECISION,
        );
    }

    function handleWheelChange(value: Color) {
        let result = Color.toRhsColorspace(value, component);
        if (intensity > 0) {
            result = Color.injectHdrIntensity(result, intensity);
        }
        result = Color.roundPrecision(result, COLOR_ROUND_PRECISION);
        setValue(result);
        onSave(name, result);
    }
}

const PointLightComponentEditor = makeCompoundComponentEditor({
    color: ColorComponentEditor,
    intensity: NumberComponentEditor,
    range: NumberComponentEditor,
    radius: NumberComponentEditor,
    shadows_enabled: BooleanComponentEditor,
    shadow_depth_bias: NumberComponentEditor,
    shadow_normal_bias: NumberComponentEditor,
});

const SpotLightComponentEditor = makeCompoundComponentEditor({
    color: ColorComponentEditor,
    intensity: NumberComponentEditor,
    range: NumberComponentEditor,
    radius: NumberComponentEditor,
    shadows_enabled: BooleanComponentEditor,
    shadow_depth_bias: NumberComponentEditor,
    shadow_normal_bias: NumberComponentEditor,
    outer_angle: NumberComponentEditor,
    inner_angle: NumberComponentEditor,
});

const DirectionalLightComponentEditor = makeCompoundComponentEditor({
    color: ColorComponentEditor,
    illuminance: NumberComponentEditor,
    shadows_enabled: BooleanComponentEditor,
    shadow_depth_bias: NumberComponentEditor,
    shadow_normal_bias: NumberComponentEditor,
});

function makeMultipleChoiceComponentEditor(
    placeholder: string,
    options: {
        value: string;
        label?: string | React.FC<{}>;
        Icon?: React.FC<{}>;
    }[],
): React.FC<ComponentEditorProps> {
    return function MultipleChoiceComponentEditor(props: ComponentEditorProps) {
        const { name, component, onSave } = props;
        const globalStore = useGlobalStore();
        const entity = globalStore.selection.first();

        const [componentValue, setComponentValue] = useState(component);

        useEffect(() => {
            setComponentValue(component);
        }, [entity, component]);

        return (
            <div className="ComponentEditor">
                <VStack>
                    <Select
                        value={componentValue}
                        onValueChange={(value) => {
                            setComponentValue(value); // So that the UI updates immediately
                            onSave(name, value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {options.map(({ value, label, Icon }) => {
                                    return (
                                        <SelectItem key={value} value={value}>
                                            {Icon && <Icon />}
                                            {label
                                                ? typeof label === "string"
                                                    ? label
                                                    : createElement(label)
                                                : value}
                                        </SelectItem>
                                    );
                                })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <HStack></HStack>
                </VStack>
            </div>
        );
    };
}

function makeCompoundComponentEditor(
    editors: Record<string, React.FC<ComponentEditorProps>>,
): React.FC<ComponentEditorProps> {
    return function CompoundComponentEditor(props: ComponentEditorProps) {
        const { name, component, onSave } = props;

        const globalStore = useGlobalStore();
        const entity = globalStore.selection.first();

        const [componentValue, setComponentValue] = useState(component);

        useEffect(() => {
            setComponentValue(component);
        }, [entity, component]);

        return (
            <div className="ComponentEditor">
                <VStack align="stretch">
                    {Object.entries(editors)
                        .filter(([name]) => name in componentValue)
                        .map(([name, Editor]) => {
                            return (
                                <Editor
                                    key={name}
                                    name={name}
                                    component={componentValue[name]}
                                    onSave={handleSave}
                                />
                            );
                        })}
                </VStack>
            </div>
        );

        function handleSave(nestedName: string, nestedComponent: any) {
            const updatedComponentValue = {
                ...componentValue,
                [nestedName]: nestedComponent,
            };
            setComponentValue(updatedComponentValue);
            onSave(name, updatedComponentValue);
        }
    };
}

function makeTopicComponentEditor(
    topic: TopicName,
    Editor: React.FC<ComponentEditorProps>,
): React.FC<ComponentEditorProps> {
    return function TopicComponentEditor(props: ComponentEditorProps) {
        return (
            <Topic topic={topic}>
                <Editor {...props} />
            </Topic>
        );
    };
}

function prettifyName(name: string) {
    return name.replace(/([a-z][a-z0-9_]+::)/g, "").replace(/_/g, " ");
}
