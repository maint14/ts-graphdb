import { GraphNode, Everything, GraphId, Connection, Index, IndexType } from '../@types/index';
import config from "../config"
import DBFileManager, { DBFileManagerAction } from './file-manager';
const { STORE_PATH } = config;

const logger = console;

class GraphDB {
  private store: string;
  private nodes: Everything = {}; // as Object of each key = GraphId of Node
  private primaryFileManager: DBFileManager<GraphNode>
  private nodeIndexes: Everything = {};
  //private connectionIndexes: Everything = {};

  constructor(store: string = STORE_PATH) {
    this.store = store;
    this.primaryFileManager = new DBFileManager(this.store + "indexedDb.json");

    this.primaryFileManager.on(DBFileManagerAction.AddedRecord, (data) => this.refreshMemoryNodes(data))
  }

  private refreshMemoryNodes(nodes: GraphNode): void {
    console.log("refreshMemoryNodes!", nodes);
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

  private createConnectionIndex(field: string) {
    return "createConnectionIndex not implemented yet"
  }

  public static createUniqueId(): number {
    return new Date().getTime()
  }

  public getNodeById(id: GraphId) {
    return this.nodes[id.toString()];
  }

  public async createNode(type: string, data: Everything): Promise<GraphNode> {
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

  //TODO test it

  public async createConnection(type: string, primaryNode: GraphNode, data: Everything, ...connectedNodes: GraphNode[]): Promise<Connection> {
    const uniqueGraphIds = connectedNodes.map(v => v.id)
    const connectionId = GraphDB.createUniqueId()

    const connection = {
      id: connectionId,
      type,
      data,
      connections: uniqueGraphIds
    } as Connection

    const node = this.getNodeById(primaryNode.id);
    node.connections.push(connection);


    await Promise.all(
      connectedNodes
        .map(v => v.id)
        .map(async nodeId =>
          await this.primaryFileManager.updateRecord(nodeId, { ...node, connections: [...node.connections, primaryNode.id] })
        )
    )

    await this.primaryFileManager.updateRecord(node.id, node);

    return Promise.resolve(connection);
  }

  public createIndex(type: IndexType, field: string) {
    if (type === IndexType.connection)
      this.createConnectionIndex(field);
    else
      this.createNodeIndex(field);
  }
}

export default GraphDB