import React, { createElement, useEffect, useRef, useState } from "react";
import { useGlobalStore } from "./store";
import useSWR from "swr";
import { Unserializable, deserialize, serialize } from "./utils";
import { fetcher } from ".";
import { Button } from "./components/Button";
import { VStack } from "./components/VStack";
import { HStack } from "./components/HStack";
import cn from "classnames";
import * as Lucide from "lucide-react";
import { TextInput } from "./components/Input";
import { Trackball } from "./components/Trackball";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "./components/Select";

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

    const { context, Icon, label, ComponentEditor } = getComponentInfo(
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
                        context != null && `context:${context}`,
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
    let context;
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
            context = "code";
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
        default:
            if (component === Unserializable) {
                context = "code";
                Icon = Lucide.Binary;
                label = "Unserializable";
            } else {
                context = "primary";
                ComponentEditor = GenericComponentEditor;
            }
            break;
    }

    return {
        context,
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
                        context="primary"
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
        <div className="ComponentEditor context:warning">
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
                <VStack grow>
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
                <VStack grow>
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
                    <VStack grow>
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

function prettifyName(name: string) {
    return name.replace(/([a-z][a-z0-9_]+::)/g, "");
}
