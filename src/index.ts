import GraphDB from "./entities/graph";
import config from "./config";
import { readdirSync, unlinkSync } from "fs";

const _clearFiles = async () => {
    const filesInDir = readdirSync(config.STORE_PATH);
    await Promise.all(filesInDir.map(async item => await unlinkSync(config.STORE_PATH+item)))
}

(async () => {
    if(process.argv[2] === "-clear")
        await _clearFiles();
    const db = new GraphDB();

    const matteo = await db.createNode("Person", {
        name: "Matteo",
        surname: "Mosca"
    });
    
    const marzia = await db.createNode("Person", {
        name: "Marzia",
        surname: "Sinigaglia"
    })

    const connection = await db.createConnection("Engaged", matteo, {married: false}, marzia);
    console.log("connection : ",connection);
/* db.createConnection("love", matteo, {married: false}, marzia); */

})()









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
/* import FileManager, {Action} from "./entities/file-manager";
const path = "/Users/matteomosca/Documents/lavoro_personale/ts-graph/store/trydb.json";

const fileManager = new FileManager(path);

fileManager.on(Action.AddedRecord, async (data) => {
    console.log("record added: ",data);
})

fileManager.writeRecord("dsadasdasdasd"); */