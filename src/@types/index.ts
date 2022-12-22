import DBFileManager from "../entities/file-manager";

export type GraphNode<T> = {
    id: GraphId;
    type: string;
    data: T;
    connections: Connection<Everything>[],
}

export type GraphId = number;

export type Everything = {
    [id: string]: any;
}

export type Connection <T> = {
    id: GraphId;
    type: string;
    data: T;
    connections: GraphId[]
}

export type Index = {
    name: string,
    fileManager: DBFileManager<GraphNode<Everything>>,
    data?: Everything
}

export enum IndexType {
    "node",
    "connection"
}