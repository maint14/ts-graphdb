import { GraphNode, Everything, GraphId, Connection } from '../@types/index';
import config from "../config"
import DBFileManager, { DBFileManagerAction } from './file-manager';
const { STORE_PATH } = config;
const isObject = (x) => typeof x === 'object';
const foundDuplicates = (x, y) =>
  !(x && y && isObject(x) && isObject(y)) ?
    x === y : Object.keys(x).every(key => foundDuplicates(x[key], y[key]));

const logger = console;

//TODO: deleteNode, updateNode, deleteConnection, deleteDB, findConnection
//TODO[low]: try to make all Everything as parametric type dove possibile
//TODO set types and return values to PUBLIC METHODS

class GraphDB {
  public readonly primaryFileManager: DBFileManager<GraphNode<Everything>>
  public readonly connectionsByTypeFileManager: DBFileManager<Connection<Everything>> = new DBFileManager(STORE_PATH + "connections_indexedByType.json");

  private store: string;
  private primaryKey: string;
  private nodes: Everything; // as Object of each key = GraphId of Node

  constructor(
    store: string = STORE_PATH,
    nodes: Everything = {},
    primaryKey: string = "id",
    primaryFileManager: DBFileManager<GraphNode<Everything>> = new DBFileManager(STORE_PATH + "indexedByPrimaryKeyDb.json")
  ) {
    this.store = store;
    this.nodes = nodes;
    this.primaryKey = primaryKey;
    this.primaryFileManager = primaryFileManager;
    this.initEvents()
  }

  private refreshMemoryNodes(nodes: GraphNode<Everything>): void {
    this.nodes = nodes;
  }

  private handleEvent(data) {
    return this.refreshMemoryNodes(data);
  }

  private initEvents() {
    this.primaryFileManager.on(DBFileManagerAction.RecordAdded, (data) => this.handleEvent(data))
    this.primaryFileManager.on(DBFileManagerAction.RecordUpdated, (data) => this.handleEvent(data))
    this.primaryFileManager.on(DBFileManagerAction.RecordRemoved,  (data) => this.handleEvent(data))
    this.primaryFileManager.on(DBFileManagerAction.FileRemoved, (data) => this.handleEvent(data))
  }

  private async createNodeIndex(field: string): Promise<GraphDB> {
    const nodes = Object.entries(this.nodes).reduce(
      (acc, [key]) => {
        const current = this.nodes[key];
        if (!!current.data[field])
          return { ...acc, [current.data[field]]: !acc[current.data[field]] ? [current] : [...acc[current.data[field]], current] }
        else {
          logger.log(`No all elements have ${field} in data, element that has not ${field} will not indexed`)
          return { ...acc };
        }
      },
      {}
    )

    const filename = "indexedBy" + field + "-nodes.json";
    const fileManager = new DBFileManager<GraphNode<Everything>>(this.store + filename);

    const db = new GraphDB(this.store, nodes, field, fileManager);
    await fileManager.replaceDB(JSON.stringify(nodes));

    return db;
  }

  public static createUniqueId(): number {
    return new Date().getTime()
  }

  public getNodeByPrimaryKey(key: GraphId): GraphNode<Everything> | GraphNode<Everything>[] {
    return this.nodes[key.toString()];
  }

  public findNode(niddle: Everything): GraphNode<Everything> | null {
    for (const [nodeId, node] of Object.entries(this.nodes)) {
      if (foundDuplicates(niddle, node.data))
        return node as GraphNode<Everything>;
    }

    return null
  }

  public async createNode<T extends Everything>(type: string, data: T): Promise<GraphNode<T>> {
    const id: number | string = this.primaryKey === 'id' ? GraphDB.createUniqueId() : data[this.primaryKey];
    const node = {
      id,
      type,
      data,
      connections: []
    }

    await this.primaryFileManager.addRecord(node)
    return Promise.resolve(node);
  }

  public async createConnection<T extends Everything>(type: string, primaryNode: GraphNode<Everything>, data: T, ...connectedNodes: GraphNode<Everything>[]): Promise<Connection<T>> {
    const uniqueNodeIds = connectedNodes.map(v => v.id)
    const connectionId = GraphDB.createUniqueId()

    const connection = {
      id: type,
      _id: connectionId,
      type,
      data,
      connections: [primaryNode.id, ...uniqueNodeIds]
    } as Connection<T>

    try {
      await this.connectionsByTypeFileManager.addRecord(connection, true)
      primaryNode.connections.push(connection);


      await this.primaryFileManager.updateRecord(primaryNode.id, primaryNode);

      // Add connection to all connectedNodes for primaryNode
      await Promise.all(
        connectedNodes.map(
          async (connectedNode) => await this.primaryFileManager.updateRecord(connectedNode.id, { ...connectedNode, connections: [...connectedNode.connections, connection] })
        )
      )

      return Promise.resolve(connection);
    } catch (e) {
      throw e;
    }
  }

  public async createIndex(field: string): Promise<GraphDB> {
    return await this.createNodeIndex(field);
  }

  public async updateConnection(connectionId: GraphId, updatedConnection: Connection<Everything>): Promise<void> {
    //TODO updateNodes with connectionvalue updated
    await this.connectionsByTypeFileManager.updateRecord(connectionId, updatedConnection, true);
  }
}

export default GraphDB