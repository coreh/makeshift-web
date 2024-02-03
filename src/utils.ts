import * as JSON5 from "json5";

export const Unserializable = Symbol("<<Unserializable>>");

export function deserialize(
    obj: { JSON5: string } | "<<Unserializable>>" | undefined | null,
): any {
    if (obj == null) {
        return undefined;
    }
    if (obj === "<<Unserializable>>") {
        // TODO: throw error?
        return Unserializable;
    }
    const inner = JSON5.parse(obj.JSON5);
    return inner[Object.keys(inner)[0]];
}

export function serialize(obj: any): { JSON5: string } {
    return { JSON5: JSON5.stringify(obj) };
}
