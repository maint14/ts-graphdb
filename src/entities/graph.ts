import { writeFileSync, readFileSync, appendFileSync, unlinkSync, existsSync, write, read, readFile } from 'fs';

import config from "../config"
const { STORE_PATH } = config;

const logger = console;

const SIMPLE_DB_FILE = "simpledatabase.json";
const INDEXED_BY_ID_FILE = "indexedbyidb.json";
const INDEX_SUBSET_FILE = "index_subsets.json";
const INDEXED_PREFIX_FILE = "indexedby";

type GraphId = number;

interface Everything {
  [id: string]: any;
}

interface GraphNode {
  id: GraphId;
  type: string;
  data: Everything;
  connections: Connection[],
}

interface Connection {
  id: GraphId;
  type: string;
  data: Everything;
  connections: GraphId[]
}

//TODO: use connection and graphNode with methods
//TODO: updateBasicFiles refresh all files and not only required files. with create/read stream we can manage better

class Graph {
  private nodes: GraphNode[];
  private indexedGraphNodes: Everything = {};
  private store: string = STORE_PATH;
  private indexSubset: string[];

  constructor(store: string | null) {
    if (store !== null)
      this.store = store;

    if (!existsSync(this.store + SIMPLE_DB_FILE))
      this.writeFile(this.store + SIMPLE_DB_FILE, [])
    this.nodes = JSON.parse(readFileSync(this.store + SIMPLE_DB_FILE, "utf-8"))

    if(!existsSync(this.store + INDEX_SUBSET_FILE))
      this.writeFile(this.store + INDEX_SUBSET_FILE, [])
    this.indexSubset = JSON.parse(readFileSync(this.store+INDEX_SUBSET_FILE, "utf-8"));

    if (existsSync(this.store + INDEXED_BY_ID_FILE))
      this.indexedGraphNodes = JSON.parse(readFileSync(this.store + INDEXED_BY_ID_FILE, "utf-8"))    
  }

  private createUniqueId(): number {
    return new Date().getTime()
  }

  private writeFile(name: string, data: Everything): void {
    if (existsSync(name))
      unlinkSync(name)

    writeFileSync(name, JSON.stringify(data))
  }

  private updateBasicFiles(): void {
    this.writeFile(this.store + SIMPLE_DB_FILE, this.nodes);
    this.writeFile(this.store + INDEXED_BY_ID_FILE, this.indexedGraphNodes);
    this.writeFile(this.store + INDEX_SUBSET_FILE, this.indexSubset);
  }

  public createNode(type: string, data: Everything): GraphNode {
    const node = {
      id: this.createUniqueId(),
      type,
      data,
      connections: []
    } as GraphNode;
    this.nodes.push(node)
    this.createGraphIdIndex();
    this.updateBasicFiles();
    return node;
  }

  public getNodeById(id: GraphId) {
    return this.indexedGraphNodes[id.toString()];
  }

  public createConnection(type: string, primaryNode: GraphNode, data: Everything, ...connectedNodes: GraphNode[]): Connection {
    const uniqueGraphIds = connectedNodes.map(v => v.id)

    const connection = {
      id: this.createUniqueId(),
      type,
      data,
      connections: uniqueGraphIds
    } as Connection

    const nodeIndex = this.nodes.findIndex(elem => elem.id === primaryNode.id);
    const node = { ...this.indexedGraphNodes[primaryNode.id] } as GraphNode;
    node.connections.push(connection);

    this.nodes[nodeIndex] = node;
    this.indexedGraphNodes[primaryNode.id] = node;

    this.createGraphIdIndex();
    this.updateBasicFiles();

    return connection;
  }

  private createGraphIdIndex(): void {
    const indexedNodes = this.nodes.reduce((acc, current) => {
      return { ...acc, [current.id]: current }
    }, {});
    this.indexedGraphNodes = indexedNodes;
  }

  public createIndexByDataSubset(subset: string) {
    const indexedNodes = this.nodes.reduce((acc, current) => {
      if (!!current.data[subset]) {
        return { ...acc, [current.data[subset]]: current }
      } else {
        logger.log(`No all elements have ${subset} in data, element that has not ${subset} will not indexed`)
        return { ...acc };
      }
    }, {})
    this.indexSubset.push(subset);

    this.writeFile(this.store + INDEXED_PREFIX_FILE + subset + ".json", indexedNodes);
    this.updateBasicFiles();
  }

  public getAllIndexSubsets() : string[] {
    return this.indexSubset;
  }

  public getNodeByIndexSubset(subset: string, key: string) {
    if(this.indexSubset.indexOf(subset) === -1) 
      throw `Subset list missing ${subset}. Use new Grap(null).getAllIndexSubsets() to know avaiable indexes or use new Grap(null).getAllIndexSubsets(string) to add one`
    const set = JSON.parse(readFileSync(this.store+INDEXED_PREFIX_FILE+subset+".json", "utf-8"))
    return set[key];
  }
}

export default Graph