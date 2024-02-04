import React, { useRef, useState } from "react";
import useSWR from "swr";
import cn from "classnames";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
    CollapsibleHeading,
} from "./components/ui/Collapsible";
import * as Lucide from "lucide-react";
import { TopicName } from "./components/ui/common";
import { useGlobalStore } from "./store";
import { deserialize, serialize } from "./utils";

const HAS = [
    "Children",
    "Camera",
    "SpotLight",
    "DirectionalLight",
    "PointLight",
    "Handle<Mesh>",
    "Handle<Scene>",
    "Window",
    "Node",
    "Text",
];

export function EntityTree() {
    const { data, isLoading, error } = useSWR(
        {
            request: "QUERY",
            params: {
                data: {
                    optional: ["Name"],
                    has: HAS,
                },
                filter: { without: ["Parent"] },
            },
        },
        {
            errorRetryInterval: 1000,
            keepPreviousData: false,
            refreshInterval: 1000,
        },
    );

    const entities = data?.content?.entities;

    return (
        <div className="EntityTree">
            {entities?.map((entity: any) => {
                return <EntityTreeNode entity={entity} key={entity.entity} />;
            })}
        </div>
    );
}

interface EntityTreeNodeProps {
    entity: any;
}

function EntityTreeNode({ entity }: EntityTreeNodeProps) {
    const parent = entity.entity;

    let name: string | undefined = deserialize(entity.optional.Name);
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const hasBeenOpen = useRef(false);
    const hasBeenHovered = useRef(false);
    const hasBeenFocused = useRef(false);
    const selection = useGlobalStore((state) => state.selection);

    if (isOpen) {
        hasBeenOpen.current = true;
    }

    if (isHovered) {
        hasBeenHovered.current = true;
    }

    if (isFocused) {
        hasBeenOpen.current = true;
    }

    const query = {
        request: "QUERY",
        params: {
            data: {
                optional: ["Name"],
                has: HAS,
            },
            filter: {
                when: {
                    "==": {
                        Parent: serialize([parent]),
                    },
                },
            },
        },
    };

    const { data, isLoading, error } = useSWR(
        hasBeenOpen.current || hasBeenHovered.current || hasBeenFocused.current
            ? query
            : null,
        {
            errorRetryInterval: 1000,
            keepPreviousData: false,
            refreshInterval: isOpen ? 1000 : undefined,
        },
    );

    const entities = data?.content?.entities;

    return (
        <Collapsible
            className="TreeNode"
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <CollapsibleHeading
                className={cn(
                    "Heading",
                    selection.has(entity.entity) && "state:selected",
                )}
                onClick={(e) => {
                    useGlobalStore.getState().replaceSelection(entity.entity);
                }}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            >
                {entity.has.Children && (
                    <CollapsibleTrigger
                        className="Chevron"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {isOpen ? (
                            <Lucide.ChevronDown />
                        ) : (
                            <Lucide.ChevronRight />
                        )}
                    </CollapsibleTrigger>
                )}
                <EntityIcon has={entity.has} />
                <EntityLabel
                    has={entity.has}
                    name={name}
                    entity={entity.entity}
                />
            </CollapsibleHeading>
            <CollapsibleContent className="Content">
                {isLoading && (
                    <Collapsible
                        className="TreeNode"
                        open={isOpen}
                        onOpenChange={setIsOpen}
                    >
                        <CollapsibleHeading className="Heading">
                            <Lucide.Loader
                                style={{
                                    animation: "spin 3000ms linear infinite",
                                }}
                            />
                            Loading…
                        </CollapsibleHeading>
                    </Collapsible>
                )}
                {!data && error && (
                    <Lucide.PlugZap
                        className="topic:error-danger"
                        style={{ color: "var(--accent)" }}
                    />
                )}
                {hasBeenOpen.current &&
                    entities?.map((entity: any) => {
                        return (
                            <EntityTreeNode
                                entity={entity}
                                key={entity.entity}
                            />
                        );
                    })}
            </CollapsibleContent>
        </Collapsible>
    );
}

interface IconProps {
    has: any;
}

function EntityIcon({ has }: IconProps) {
    let icon;
    let topic: TopicName | undefined = undefined;
    if (has.PointLight) {
        icon = <Lucide.Lightbulb />;
        topic = "light";
    } else if (has.SpotLight) {
        icon = <Lucide.LampDesk />;
        topic = "light";
    } else if (has.DirectionalLight) {
        icon = <Lucide.Sunset />;
        topic = "light";
    } else if (has.Camera) {
        icon = <Lucide.Video />;
    } else if (has["Handle<Mesh>"]) {
        topic = "asset";
        icon = <Lucide.Box />;
    } else if (has["Window"]) {
        icon = <Lucide.AppWindow />;
    } else if (has["Text"]) {
        icon = <Lucide.Type />;
    } else if (has["Node"]) {
        icon = <Lucide.MousePointerSquareDashed />;
    } else if (has["Handle<Scene>"]) {
        topic = "asset";
        icon = <Lucide.Shapes />;
    } else {
        icon = <Lucide.CircleDashed />;
    }

    return (
        <div className={cn("EntityIcon", topic != null && `topic:${topic}`)}>
            {icon}
        </div>
    );
}

interface EntityLabelProps {
    has: any;
    entity: number;
    name?: string;
}

function EntityLabel({ has, name, entity }: EntityLabelProps) {
    if (name) {
        return name;
    }

    let label;
    if (has.PointLight) {
        label = "Point Light";
    } else if (has.SpotLight) {
        label = "Spot Light";
    } else if (has.DirectionalLight) {
        label = "Directional Light";
    } else if (has.Camera) {
        label = "Camera";
    } else if (has["Handle<Mesh>"]) {
        label = "Mesh";
    } else if (has["Window"]) {
        label = "Window";
    } else if (has["Text"]) {
        label = "Text";
    } else if (has["Node"]) {
        label = "UI Node";
    } else if (has["Handle<Scene>"]) {
        label = "Scene";
    } else {
        label = "Entity";
    }

    let id = BigInt(entity) & BigInt(0xffffffff);
    let generation = (BigInt(entity) >> BigInt(32)) & BigInt(0xffffffff);

    label = `${label} (${id}v${generation})`;

    return <i>{label}</i>;
}
