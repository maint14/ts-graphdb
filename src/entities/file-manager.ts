import { createWriteStream, existsSync, readFileSync, unlinkSync, WriteStream } from "fs";
import { Everything } from "../@types";

export enum DBFileManagerAction {
  "AddedRecord"
}

type ActionCallback<V> = (data: V) => Promise<void> | void;


//TODO refactor promise<void> with promise<result> and create interface for result
export default class DBFileManager<T extends { id: number }> {
  private wStream: WriteStream;
  private path: string;
  private addedRecordCallbacks: ActionCallback<T>[] = [];

  constructor(path: string) {
    this.path = path;
    this.setUpWS();
  }

  private setUpWS() : void {
    this.wStream = createWriteStream(this.path);
    this.wStream.on("finish", () => this.newStreamData())
  }

  private elaborateCallback(arrayOfCallbacks: ActionCallback<T>[], data: any): void {
    arrayOfCallbacks.forEach(callback => callback(data));
  }

  private newStreamData() {
    const _data = readFileSync(this.path, "utf-8");

    this.elaborateCallback(this.addedRecordCallbacks, JSON.parse(_data));
  }

  private getFileContent(): Everything {
    try {
      return JSON.parse(readFileSync(this.path, "utf-8"))
    } catch (e) {
      return {};
    }
  }

  private removeDBFile() : void {
    if (existsSync(this.path))
      unlinkSync(this.path)
  }

  //horrible promise
  private writeFile(content: string): Promise<void> {
    return new Promise(resolve => {
      this.removeDBFile();
      this.setUpWS()
      this.wStream.write(content, () => {
        this.wStream.end();
        resolve();
      });
    })
  }

  public async replaceDB(db: string): Promise<void> {
    return await this.writeFile(db);
  }

  public async addRecord(record: T): Promise<void> {
    const db = this.getFileContent();
    db[record.id.toString()] = record;
    return await this.writeFile(JSON.stringify(db));
  }

  public async updateRecord(searchId: number, replaceRecord: T): Promise<void> {
    console.log("updateRecord: ",searchId, " ", replaceRecord)
    const db = this.getFileContent();
    db[searchId.toString()] = replaceRecord;
    return await this.writeFile(JSON.stringify(db));
  }

  public on(action: DBFileManagerAction, callback: ActionCallback<T>) {
    if (action === DBFileManagerAction.AddedRecord)
      this.addedRecordCallbacks.push(callback);
  }

}