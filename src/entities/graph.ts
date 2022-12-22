import { GraphNode, Everything, GraphId, Connection, Index, IndexType } from '../@types/index';
import config from "../config"
import DBFileManager, { DBFileManagerAction } from './file-manager';
const { STORE_PATH } = config;

const logger = console;

//TODO: fix indexing problem : se la colonna da indicizzare non è univoca non avrai doppi risultati su stessa chiave
//TODO: refactor promise<void> with promise<result> and create interface for result

class GraphDB {
  public readonly primaryFileManager: DBFileManager<GraphNode<Everything>>

  private store: string;
  private primaryKey : string;
  private nodes: Everything; // as Object of each key = GraphId of Node
  private nodeIndexes: Everything = {};

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
    this.primaryFileManager.on(DBFileManagerAction.AddedRecord, async (data) => await this.refreshMemoryNodes(data))
  }

  private async refreshMemoryNodes(nodes: GraphNode<Everything>): Promise<void> {
    this.nodes = nodes;
    return Promise.resolve()
  }

  private async createNodeIndex(field: string): Promise<GraphDB> {
    const nodes = Object.entries(this.nodes).reduce((acc, [key, current]) => {
      if (!!current.data[field])
        return { ...acc, [current.data[field]]: current }
      else {
        logger.log(`No all elements have ${field} in data, element that has not ${field} will not indexed`)
        return { ...acc };
      }
    }, {})

    console.log("nodes indexed for field: ", field);

    const filename = "indexedBy" + field + "-nodes.json";
    const fileManager = new DBFileManager<GraphNode<Everything>>(this.store + filename);

    const db = new GraphDB(this.store, nodes, field, fileManager);
    await fileManager.replaceDB(JSON.stringify(nodes));

    return db;
  }

  //TODO implements
  private createConnectionIndex(field: string): Promise<GraphDB> {
    return Promise.resolve(new GraphDB(this.store));
  }

  public static createUniqueId(): number {
    return new Date().getTime()
  }

  public getNodeByPrimaryKey(key: GraphId | string) {
    return this.nodes[key.toString()];
  }

  public async createNode<T extends Everything>(type: string, data: T): Promise<GraphNode<T>> {
    console.log("createNode", type);
    const id : number | string = this.primaryKey === 'id' ? GraphDB.createUniqueId() : data[this.primaryKey];
    const node = {
      id,
      type,
      data,
      connections: []
    }

    await this.primaryFileManager.addRecord(node)
    console.log("finito di creare node");
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

  public async createIndex(field: string, type: IndexType = IndexType.node) : Promise<GraphDB>{
    if (type === IndexType.connection)
      return await this.createConnectionIndex(field);
    else
      return await this.createNodeIndex(field);
  }
}

export default GraphDB