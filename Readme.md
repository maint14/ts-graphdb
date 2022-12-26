# Experimental GraphDB in typescript

## Summary
Experimental GraphDB in typescript with only nodejs/ts compiler as dev dependency and JSON for storage data.

## Goals
- Reactive file manager using events to write and read data
- Reactive graph system that use FileManager to manage data
- Indexing for all types/data inserted on Connection or Node
- Fast and light system

## GRAPH SYSTEM FEATURES
- [x] get node by primary key (autogenerated key or custom key)
- [x] find node
- [x] create node
- [x] create connection
- [x] create index
- [ ] update connection
- [ ] delete node
- [ ] update node
- [ ] delete connection
- [ ] delete db
- [ ] find connection

## FILE MANAGER FEATURES
### Events
- [x] RecordAdded
- [x] FileRemoved
- [x] RecordRemoved
- [x] RecordUpdated

### Features
- [x] set events with ON method
- [x] remove single record
- [x] add single record
- [x] remove single record
- [x] resolves indexing collision problems
- [x] replace entire db
- [ ] add multiple record
- [ ] remove multiple record
- [ ] update multiple record (?)

## Conclusion
At the moment there are only graph/filesystem class to manage files and db, in the near future we will implement socket connection to comunicate with the db using a sql-like language.

## Work in progress on develop branch...
