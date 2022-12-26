import { createWriteStream, existsSync, readFileSync, unlinkSync, writeFile, writeFileSync, WriteStream } from "fs";
import { Everything, GraphId } from "../@types";

export enum DBFileManagerAction {
  "RecordAdded",
  "FileRemoved",
  "RecordRemoved",
  "RecordUpdated"
}

type ActionCallback<V> = (data: V) => Promise<void> | void;

export default class DBFileManager<T extends { id?: number | string }> {
  private path: string;
  private addedRecordCallbacks: ActionCallback<T>[] = [];
  private fileRemovedCallbacks: ActionCallback<T>[] = [];
  private recordRemovedCallbacks: ActionCallback<T>[] = [];
  private recordUpdatedCallbacks: ActionCallback<T>[] = [];


  constructor(path: string) {
    this.path = path;
  }

  private async elaborateCallback(arrayOfCallbacks: ActionCallback<T>[], data: any): Promise<void> {
    await Promise.all(arrayOfCallbacks.map(async callback => await callback(data)));
  }

  private getFileContent(): Everything {
    try {
      return JSON.parse(readFileSync(this.path, "utf-8"))
    } catch (e) {
      return {};
    }
  }

  private async removeDBFile(elabCallback: boolean = true): Promise<void> {
    if (existsSync(this.path))
      unlinkSync(this.path)
    if (elabCallback)
      await this.elaborateCallback(this.fileRemovedCallbacks, null)
  }

  //horrible promise
  private async writeFile(content: string): Promise<void> {
    await this.removeDBFile(false)
    writeFileSync(this.path, content)
    await this.elaborateCallback(this.addedRecordCallbacks, JSON.parse(content))
    return Promise.resolve()
  }

  public async replaceDB(db: string): Promise<void> {
    return await this.writeFile(db);
  }

  public async addRecord(record: T, collision: boolean = false): Promise<void> {
    const db = this.getFileContent();

    if (collision)
      db[record.id!.toString()] = !!db[record.id!.toString()] ? [...db[record.id!.toString()], record] : [record]
    else
      db[record.id!.toString()] = record;

    return await this.writeFile(JSON.stringify(db));
  }

  public async updateRecord(searchId: GraphId, replaceRecord: T, collision: boolean = false): Promise<void> {
    const db = this.getFileContent();
    //TODO export entris map and reduce functions to use it anywhere
    const updatedDb = !collision ?
      { ...db, [searchId.toString()]: replaceRecord } :
      Object.entries(db).map(([key]) => {
        const value =  db[key];
        return value.map((item) => {
          if (item._id! === searchId)
            return replaceRecord;
          return item;
        })
      }).flat().reduce((acc, current) => {
        console.log("current: ",current);
        return !!acc[current.id] ? 
          {...acc, [current.id]: [...acc[current.id], current]} :
          {...acc, [current.id]: [current]}
      }, {})

    await this.writeFile(JSON.stringify(updatedDb));
    await this.elaborateCallback(this.recordUpdatedCallbacks, updatedDb)
  }

  public async removeRecord(searchId: GraphId) {
    const db = this.getFileContent();
    delete db[searchId];
    await this.writeFile(JSON.stringify(db));
    await this.elaborateCallback(this.recordRemovedCallbacks, db);
  }

  public on(action: DBFileManagerAction, callback: ActionCallback<T>): void {
    if (action === DBFileManagerAction.RecordAdded)
      this.addedRecordCallbacks.push(callback);
    if (action === DBFileManagerAction.FileRemoved)
      this.fileRemovedCallbacks.push(callback)
    if (action === DBFileManagerAction.RecordRemoved)
      this.recordRemovedCallbacks.push(callback);
    if (action === DBFileManagerAction.RecordUpdated)
      this.recordUpdatedCallbacks.push(callback);
  }

}