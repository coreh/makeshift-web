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
    try {
        const inner = JSON5.parse(obj.JSON5);
        return inner[Object.keys(inner)[0]];
    } catch (e) {
        // This is a massive hack to work around the rust JSON5 crate
        // not properly handling numerical keys in maps.
        const patchedJSON5 = obj.JSON5.replace(/(?<=[\,\{])(\d+):/g, '"$1":');
        console.log(patchedJSON5);
        return JSON5.parse(patchedJSON5);
    }
}

export function serialize(obj: any): { JSON5: string } {
    return {
        JSON5: JSON5.stringify(obj).replace(/"(?<=[\,\{])(\d+)":/g, "$1:"),
    };
}
