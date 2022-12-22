import { GraphNode, Everything, GraphId, Connection, Index, IndexType } from '../@types/index';
import config from "../config"
import DBFileManager, { DBFileManagerAction } from './file-manager';
const { STORE_PATH } = config;
const isObject = (x) => typeof x === 'object';
const foundDuplicates = (x, y) => 
      !(x && y && isObject(x) && isObject(y)) ? 
       x === y : Object.keys(x).every(key => foundDuplicates(x[key], y[key]));

const logger = console;

//TODO: deleteNode, deleteConnection, deleteDB

class GraphDB {
  public readonly primaryFileManager: DBFileManager<GraphNode<Everything>>

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
    this.primaryFileManager.on(DBFileManagerAction.RecordAdded, async (data) => await this.refreshMemoryNodes(data))
  }

  private async refreshMemoryNodes(nodes: GraphNode<Everything>): Promise<void> {
    this.nodes = nodes;
    return Promise.resolve()
  }

  private async createNodeIndex(field: string): Promise<GraphDB> {
    const nodes = Object.entries(this.nodes).reduce(
      (acc, [key, current]) => {
        if (!!current.data[field])
          return { ...acc, [current.data[field]]: !acc[current.data[field]] ? [current] : [...acc[current.data[field]] , current] }
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

  public getNodeByPrimaryKey(key: GraphId) : GraphNode<Everything> | GraphNode<Everything>[] {
    return this.nodes[key.toString()];
  }

  public findNode(niddle: Everything) : GraphNode<Everything> | null {
    for(const [nodeId, node] of Object.entries(this.nodes)){
      if(foundDuplicates(niddle, node.data))
        return node as GraphNode<Everything>;
    }

    return null
  }

  //TODO: create indexed connections file and implements thoose
  public getConnectionByPrimaryKey(connection : Everything) {}
  public getNodeConnections(node: GraphNode<Everything>) : Connection<Everything>[] {
    return []
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
      id: connectionId,
      type,
      data,
      connections: [primaryNode.id, ...uniqueNodeIds]
    } as Connection<T>
    primaryNode.connections.push(connection);

    await this.primaryFileManager.updateRecord(primaryNode.id, primaryNode);
    await Promise.all(
      connectedNodes.map(
        async (connectedNode) => await this.primaryFileManager.updateRecord(connectedNode.id, { ...connectedNode, connections: [...connectedNode.connections, connection] })
      )
    )

    return Promise.resolve(connection);
  }

  public async createIndex(field: string): Promise<GraphDB> {
    return await this.createNodeIndex(field);
  }
}

export default GraphDB