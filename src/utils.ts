export const Unserializable = Symbol("<<Unserializable>>");

export function deserialize(
    obj: { JSON: string } | "<<Unserializable>>" | undefined | null,
): any {
    if (obj == null) {
        return undefined;
    }
    if (obj === "<<Unserializable>>") {
        // TODO: throw error?
        return Unserializable;
    }
    const inner = JSON.parse(obj.JSON);
    return inner[Object.keys(inner)[0]];
}

export function serialize(obj: any): { JSON: string } {
    return { JSON: JSON.stringify(obj) };
}
