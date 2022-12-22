import GraphDB from "./entities/graph";
import config from "./config";
import { readdirSync, unlinkSync } from "fs";
import createPeopleArray, {isEven, randInt, SOME_CONNECTION_PAIR_TYPE_VALUES} from "../resources/create_people";
import { Everything, GraphNode } from "./@types";

const _clearFiles = async () => {
    const filesInDir = readdirSync(config.STORE_PATH);
    await Promise.all(filesInDir.map(async item => await unlinkSync(config.STORE_PATH+item)))
}



(async () => {
    const random = randInt(1,100);
    if(process.argv[2] === "-clear")
        await _clearFiles();

    const db = new GraphDB();

    const people = createPeopleArray(20);
    let old_person : any = false
    for(const person of people) {
        const newNode = await db.createNode("Person", person);
        if(old_person)
            await db.createConnection(
                isEven(random) ? SOME_CONNECTION_PAIR_TYPE_VALUES[0].type : SOME_CONNECTION_PAIR_TYPE_VALUES[1].type,
                newNode,
                isEven(random) ? SOME_CONNECTION_PAIR_TYPE_VALUES[0].value : SOME_CONNECTION_PAIR_TYPE_VALUES[1].value,
                old_person
            )
        old_person = newNode
    }
    /* //TODO implements with connections
    const newDb = await db.createIndex("surname")
    newDb.createNode("Person", {name: "Riccardo", surname: "Corsi"}); */


/* 
    const matteo = await db.createNode("Person", {
        name: "Matteo",
        surname: "Mosca"
    });
    
    const marzia = await db.createNode("Person", {
        name: "Marzia",
        surname: "Sinigaglia"
    })

    const connection = await db.createConnection("Engaged", matteo, {married: false}, marzia);
    const db2 = await db.createIndex("name");

    db2.createNode("Cuscino", {
        name: "giangi",
        surname: "il morto :(",
        age: 7
    })
    
    const node = db2.getNodeByPrimaryKey("Matteo");

    console.log("node: ",node); */


})()