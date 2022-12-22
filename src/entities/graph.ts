import { GraphNode, Everything, GraphId, Connection, Index, IndexType } from '../@types/index';
import config from "../config"
import DBFileManager, { DBFileManagerAction } from './file-manager';
const { STORE_PATH } = config;

const logger = console;

class GraphDB {
  private store: string;
  private nodes: Everything = {}; // as Object of each key = GraphId of Node
  private primaryFileManager: DBFileManager<GraphNode<Everything>>
  private nodeIndexes: Everything = {};
  //private connectionIndexes: Everything = {};

  constructor(store: string = STORE_PATH) {
    this.store = store;
    this.primaryFileManager = new DBFileManager(this.store + "indexedDb.json");

    this.primaryFileManager.on(DBFileManagerAction.AddedRecord, (data) => this.refreshMemoryNodes(data))
  }

  private refreshMemoryNodes(nodes: GraphNode<Everything>): void {
    this.nodes = nodes;
  }

  private refreshIndexedNodes(field: string, nodes: Everything) {
    this.nodeIndexes[field].data = nodes;
  }

  private createNodeIndex(field: string) {
    const nodes = Object.entries(this.nodes).reduce((acc, [key, current]) => {
      if (!!current.data[field])
        return { ...acc, [current.data[field]]: current }
      else {
        logger.log(`No all elements have ${field} in data, element that has not ${field} will not indexed`)
        return { ...acc };
      }
    }, {})

    console.log("nodes indexed for field: ", field);

    const fileManager = new DBFileManager(this.store + "indexedBy" + field + "-nodes.json");

    const indexedNodes: Index = {
      name: field,
      fileManager,
      data: null
    } as Index

    fileManager.replaceDB(JSON.stringify(nodes));
    fileManager.on(DBFileManagerAction.AddedRecord, async (updatedIndexedNodes) => this.refreshIndexedNodes(field, updatedIndexedNodes))

    this.nodeIndexes[field] = indexedNodes;
  }

  private createConnectionIndex(field: string): string {
    return "createConnectionIndex not implemented yet"
  }

  public static createUniqueId(): number {
    return new Date().getTime()
  }

  public getNodeById(id: GraphId) {
    return this.nodes[id.toString()];
  }

  public async createNode<T>(type: string, data: T): Promise<GraphNode<T>> {
    const id = GraphDB.createUniqueId();
    const node = {
      id,
      type,
      data,
      connections: []
    }

    await this.primaryFileManager.addRecord(node)
    return node;
  }

  public async createConnection<T>(type: string, primaryNode: GraphNode<Everything>, data: T, ...connectedNodes: GraphNode<Everything>[]): Promise<Connection<T>> {
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

  public createIndex(field: string, type: IndexType = IndexType.node) {
    if (type === IndexType.connection)
      this.createConnectionIndex(field);
    else
      this.createNodeIndex(field);
  }
}

export default GraphDB