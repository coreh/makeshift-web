import React, { useEffect, useRef, useState } from "react";
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
        { keepPreviousData: true, refreshInterval: 100 },
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
                {name}
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
    const { label } = getComponentInfo(name, component);
    console.log(name, label);

    if (label === "Marker") {
        return -10;
    }

    if (label === "Unserializable") {
        return 100;
    }

    if (label === "Computed") {
        return 20;
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
        case "bevy_hierarchy::components::parent::Parent":
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
            context = "code";
            Icon = Lucide.ArrowBigRightDash;
            label = "Computed";
            break;
        case "bevy_window::window::PrimaryWindow":
            context = "code";
            Icon = Lucide.Tag;
            label = "Marker";
            break;
        case "bevy_render::view::visibility::Visibility":
            Icon = Lucide.Eye;
            ComponentEditor = VisibilityComponentEditor;
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

function VisibilityComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();

    return (
        <div className="ComponentEditor">
            <VStack>
                <select
                    onChange={(e) => props.onSave(props.name, e.target.value)}
                >
                    <option>Inherited</option>
                    <hr />
                    <option>Visible</option>
                    <option>Hidden</option>
                </select>
                <HStack></HStack>
            </VStack>
        </div>
    );
}
