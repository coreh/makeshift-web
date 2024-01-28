import { create } from "zustand";
import * as Immutable from "immutable";

export interface GlobalStore {
    selection: Immutable.Set<string>;
    replaceSelection: (entity: string | Immutable.Set<string>) => void;
    addToSelection: (entity: string | Immutable.Set<string>) => void;
    removeFromSelection: (entity: string | Immutable.Set<string>) => void;
    toggleSelection: (entity: string) => void;

    brpRequests: Immutable.Map<string, number>;
    incrementBrpRequest: (request: string) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
    selection: Immutable.Set(),
    replaceSelection: (entity: string | Immutable.Set<string>) => {
        set({
            selection: Immutable.Set.isSet(entity)
                ? entity
                : Immutable.Set([entity]),
        });
    },
    addToSelection: (entity: string | Immutable.Set<string>) => {
        set((state) => ({
            selection: Immutable.Set.isSet(entity)
                ? state.selection.union(entity)
                : state.selection.add(entity),
        }));
    },
    removeFromSelection: (entity: string | Immutable.Set<string>) => {
        set((state) => ({
            selection: Immutable.Set.isSet(entity)
                ? state.selection.subtract(entity)
                : state.selection.remove(entity),
        }));
    },
    toggleSelection: (entity: string) => {
        set((state) => ({
            selection: state.selection.has(entity)
                ? state.selection.remove(entity)
                : state.selection.add(entity),
        }));
    },

    brpRequests: Immutable.Map(),
    incrementBrpRequest: (request: string) => {
        set((state) => {
            const count = state.brpRequests.get(request) ?? 0;
            return {
                brpRequests: state.brpRequests.set(request, count + 1),
            };
        });
    },
}));
