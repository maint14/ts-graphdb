import { Readable, Writable } from "stream";
import { createReadStream, createWriteStream, readFileSync, ReadStream, WriteStream } from "fs";

//create event (spizza job di inck) per dare sempre un valore aggiornato che rappresenta l'intero file

export default class FileManager {
    private wStream : WriteStream;
    private path : string;
    private updatedStreamData : any; //Check type of chunk on Readable.on("data", (chunk) => void)

    constructor(path: string) {
        this.wStream = createWriteStream(path);
        this.path = path;

        this.wStream.on("finish", this.newStreamData)
    }

    private newStreamData() {
        const _data = readFileSync(this.path, "utf-8");
        console.log("data after finish first write", _data)
        //to something with chunk, this.updatedStreamData = chunk ?
    }

    private getFileContent() : string {
        return readFileSync(this.path,"utf-8")
    }

    public writeRecord(record : string, appendLine : boolean = false) : void {
        const data = appendLine ? this.getFileContent()+record : record;
        this.wStream.write(data);
        this.wStream.end();
    }

}