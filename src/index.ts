//import Graph from "./entities/graph";
//const graph = new Graph(null);
/* const graph = new Graph(null);
const node1 = graph.createNode("Person", {name: 'name1', surname: 'surname1'});
const node2 = graph.createNode("Person", {name: "name2", surname: "surname2"});

const connection1 = graph.createConnection("love", node1, {"married": false}, node2)
const connection2 = graph.createConnection("love", node2, {"married": false}, node1)

const nodes = graph.getNodeById(node1.id);
graph.createIndexByDataSubset("name") */

/*const node = graph.getNodeByIndexSubset("name", "name1");

console.log("node : ",node);*/
import FileManager from "./entities/file-manager";
const path = "/Users/matteomosca/Documents/lavoro_personale/ts-graph/store/trydb.json";

const fileManager = new FileManager(path);
fileManager.writeRecord("dsadasdasdasd");