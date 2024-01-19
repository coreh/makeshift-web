import React, { useEffect, useState } from "react";
import { useGlobalStore } from "./store";
import useSWR from "swr";
import { Unserializable, deserialize, serialize } from "./utils";
import { fetcher } from ".";
import { Button } from "./components/Button";
import { VStack } from "./components/VStack";
import { HStack } from "./components/HStack";
import cn from "classnames";
import * as Lucide from "lucide-react";

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

    return (
        <div className="Inspector">
            {components &&
                Object.entries(components)?.map(([name, component]) => {
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
    component = deserialize(component);

    const globalStore = useGlobalStore();

    let context;
    let label;
    let Icon: React.FC<{}>;
    let ComponentEditor: React.FC<ComponentEditorProps> | undefined;
    switch (name) {
        case "bevy_hierarchy::components::children::Children":
        case "bevy_hierarchy::components::parent::Parent":
            return;
        case "bevy_render::view::visibility::InheritedVisibility":
        case "bevy_render::view::visibility::ViewVisibility":
        case "bevy_transform::components::global_transform::GlobalTransform":
            Icon = Lucide.ArrowBigRightDash;
            label = "Computed";
            break;
        default:
            if (component === Unserializable) {
                context = "code";
                Icon = Lucide.Binary;
                label = "Unserializable";
            } else {
                context = "primary";
                ComponentEditor = GenericComponentEditor;
                Icon = Lucide.ToyBrick;
            }
            break;
    }

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

export function GenericComponentEditor(props: ComponentEditorProps) {
    const globalStore = useGlobalStore();
    const entity = globalStore.selection.first();
    const stringified = JSON.stringify(props.component, null, 4);
    const [text, setText] = useState("");
    useEffect(() => {
        setText(stringified);
    }, [entity, stringified]);
    return (
        <div className="GenericComponentEditor">
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
        <div className="UnserializableComponentEditor context:warning">
            <Lucide.PlugZap />
            Unserializable
        </div>
    );
}
