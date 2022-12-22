import { createWriteStream, existsSync, readFileSync, unlinkSync, writeFile, writeFileSync, WriteStream } from "fs";
import { Everything, GraphId } from "../@types";

export enum DBFileManagerAction {
  "RecordAdded",
  "FileRemoved", 
  "RecordRemoved"//TODO
}

type ActionCallback<V> = (data: V) => Promise<void>;

export default class DBFileManager<T extends { id?: number | string }> {
  private wStream: WriteStream;
  private path: string;
  private addedRecordCallbacks: ActionCallback<T>[] = [];
  private fileRemovedCallbacks: ActionCallback<T>[] = [];
  private recordRemovedCallbacks: ActionCallback<T>[] = [];

  constructor(path: string) {
    this.path = path;
    this.setUpWS();
  }

  private setUpWS() : void {
    this.wStream = createWriteStream(this.path);
    this.wStream.on("finish", async () => await this.newStreamData())
  }

  private async elaborateCallback(arrayOfCallbacks: ActionCallback<T>[], data: any): Promise<void> {
    await Promise.all(arrayOfCallbacks.map(async callback => await callback(data)));
  }

  private async newStreamData() : Promise<void>{
    const _data = readFileSync(this.path, "utf-8");

    await this.elaborateCallback(this.addedRecordCallbacks, JSON.parse(_data));
  }

  private getFileContent(): Everything {
    try {
      return JSON.parse(readFileSync(this.path, "utf-8"))
    } catch (e) {
      return {};
    }
  }

  private async removeDBFile() : Promise<void> {
    if (existsSync(this.path))
      unlinkSync(this.path)
    await this.elaborateCallback(this.fileRemovedCallbacks, null)
  }

  //horrible promise
  private writeFile(content: string): Promise<void> {
    return new Promise(async resolve => {
      /* this.removeDBFile()
      writeFileSync(this.path, content)
      resolve() */
      await this.removeDBFile();
      this.setUpWS()
      this.wStream.write(content, (err) => {
        if(err)
          throw err;
        this.wStream.end(() => resolve());
      }); 
    })
  }

  public async replaceDB(db: string): Promise<void> {
    return await this.writeFile(db);
  }

  public async addRecord(record: T): Promise<void> {
    const db = this.getFileContent();
    db[record.id!.toString()] = record;
    return await this.writeFile(JSON.stringify(db));
  }

  public async updateRecord(searchId: GraphId, replaceRecord: T): Promise<void> {
    const db = this.getFileContent();
    db[searchId.toString()] = replaceRecord;
    return await this.writeFile(JSON.stringify(db));
  }

  public async removeRecord(searchId: GraphId) {
    const db = this.getFileContent();
    delete db[searchId];
    return await this.writeFile(JSON.stringify(db));
  }

  public on(action: DBFileManagerAction, callback: ActionCallback<T>): void {
    if (action === DBFileManagerAction.RecordAdded)
      this.addedRecordCallbacks.push(callback);
    if( action === DBFileManagerAction.FileRemoved)
      this.fileRemovedCallbacks.push(callback)
    if(action === DBFileManagerAction.RecordRemoved)
      this.recordRemovedCallbacks.push(callback);
  }

}