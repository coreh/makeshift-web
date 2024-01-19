import React, { useRef, useState } from "react";
import useSWR from "swr";
import cn from "classnames";
import {
    TreeNode,
    TreeChevron,
    TreeContent,
    TreeHeading,
} from "./components/Collapsible";
import * as Lucide from "lucide-react";
import { UIContext } from "./components/common";

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
        { errorRetryInterval: 1000, keepPreviousData: false },
    );

    if (error) return <div />;
    if (isLoading) return <div>Loading...</div>;

    const entities = data?.content?.entities;
    return (
        <div>
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

    let name: string | undefined;
    if (entity.optional.Name != null) {
        const Name = JSON.parse(entity.optional.Name.JSON);
        name = Name[Object.keys(Name)[0]].name;
    }

    const { data, isLoading, error } = useSWR(
        {
            request: "QUERY",
            params: {
                data: {
                    optional: ["Name"],
                    has: HAS,
                },
                filter: {
                    when: {
                        "==": {
                            Parent: { JSON: JSON.stringify([parent]) },
                        },
                    },
                },
            },
        },
        { errorRetryInterval: 1000, keepPreviousData: false },
    );
    const [isOpen, setIsOpen] = useState(false);
    const hasBeenOpen = useRef(false);

    if (isOpen) {
        hasBeenOpen.current = true;
    }

    const entities = data?.content?.entities;

    if (!data && error) {
        return (
            <TreeNode open={isOpen} onOpenChange={setIsOpen}>
                <TreeHeading className="context:error-danger">
                    <Lucide.PlugZap style={{ color: "var(--accent)" }} />
                    <i
                        style={{
                            opacity: 0.5,
                            color: "var(--accent)",
                        }}
                    >
                        Failed to Load
                    </i>
                </TreeHeading>
            </TreeNode>
        );
    }
    if (isLoading) {
        return (
            <TreeNode open={isOpen} onOpenChange={setIsOpen}>
                <TreeHeading>
                    <Lucide.Loader
                        style={{
                            animation: "spin 3000ms linear infinite",
                        }}
                    />
                    <i
                        style={{
                            opacity: 0.5,
                        }}
                    >
                        Loading...
                    </i>
                </TreeHeading>
            </TreeNode>
        );
    }

    return (
        <TreeNode open={isOpen} onOpenChange={setIsOpen}>
            <TreeHeading>
                {entities?.length > 0 && (
                    <TreeChevron>
                        {isOpen ? (
                            <Lucide.ChevronDown />
                        ) : (
                            <Lucide.ChevronRight />
                        )}
                    </TreeChevron>
                )}
                <EntityIcon has={entity.has} />
                <EntityLabel
                    has={entity.has}
                    name={name}
                    entity={entity.entity}
                />
            </TreeHeading>
            <TreeContent>
                {hasBeenOpen.current &&
                    entities?.map((entity: any) => {
                        return (
                            <EntityTreeNode
                                entity={entity}
                                key={entity.entity}
                            />
                        );
                    })}
            </TreeContent>
        </TreeNode>
    );
}

interface IconProps {
    has: any;
}

function EntityIcon({ has }: IconProps) {
    let icon;
    let context: UIContext | undefined = undefined;
    if (has.PointLight) {
        icon = <Lucide.Lightbulb />;
        context = "light";
    } else if (has.SpotLight) {
        icon = <Lucide.LampDesk />;
        context = "light";
    } else if (has.DirectionalLight) {
        icon = <Lucide.Sunset />;
        context = "light";
    } else if (has.Camera) {
        icon = <Lucide.Video />;
    } else if (has["Handle<Mesh>"]) {
        context = "asset";
        icon = <Lucide.Box />;
    } else if (has["Window"]) {
        icon = <Lucide.AppWindow />;
    } else if (has["Text"]) {
        icon = <Lucide.Type />;
    } else if (has["Node"]) {
        icon = <Lucide.MousePointerSquareDashed />;
    } else if (has["Handle<Scene>"]) {
        context = "asset";
        icon = <Lucide.Shapes />;
    } else {
        icon = <Lucide.CircleDashed />;
    }

    return (
        <div
            className={cn(
                "EntityIcon",
                context != null && `context:${context}`,
            )}
        >
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
