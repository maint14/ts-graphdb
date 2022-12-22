import GraphDB from "./entities/graph";
import config from "./config";
import { readdirSync, unlinkSync } from "fs";
import createPeopleArray, {SOME_CONNECTION_PAIR_TYPE_VALUES} from "../resources/create_people";

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

})()