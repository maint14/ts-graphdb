export type GraphNode<T> = {
    id: GraphId;
    type: string;
    data: T;
    connections: Connection<Everything>[],
}

export type GraphId = number | string;

export type Everything = {
    [id: string]: any;
}

export type Connection <T> = {
    id: GraphId;
    type: string;
    data: T;
    connections: GraphId[]
}