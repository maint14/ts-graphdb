import DBFileManager from "../entities/file-manager";

export type GraphNode = {
    id: GraphId;
    type: string;
    data: Everything;
    connections: Everything,
}

export type GraphId = number;

export type Everything = {
    [id: string]: any;
}

export type Connection = {
    id: GraphId;
    type: string;
    data: Everything;
    connections: GraphId[]
}

export type Index = {
    name: string,
    fileManager: DBFileManager<GraphNode>,
    data?: Everything
}

export enum IndexType {
    "node",
    "connection"
}