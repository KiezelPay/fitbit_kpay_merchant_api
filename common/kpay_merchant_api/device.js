import { peerSocket } from "messaging";
import { inbox } from "file-transfer";
import { readFileSync, writeFileSync } from "fs";

import * as common from './common.js';
import KpayMerchantApiData from './data.js';

export default class KpayMerchantApi {
  
  constructor() {
    this._apiData = new KpayMerchantApiData(this._loadFromFile, this._storeInFile);
    this.onerror = undefined;
    this.onsuccess = undefined;
    
    // Event occurs when new file(s) are received
    inbox.addEventListener("newfile", (event) => {
      let fileName = getCustomFile();
      if (fileName && fileName === common.MESSAGE_DATA_FILE) {
        let msg = readFileSync(fileName, "cbor");
        this._parseIncomingMsg(msg);
      }
    });
  }
  
  setMaximumAge(maximumAge) {
    this._apiData.setMaximumAge(maximumAge);
  }
   
  getSummary() {
    return this._apiData.get(common.SUMMARY);
  }
  
  getToday() {
    return this._apiData.get(common.TODAY);
  }
  
  getYesterday() {
    return this._apiData.get(common.YESTERDAY);
  }
  
  fetchSummary() {
    return this._fetchData(common.SUMMARY);
  }
  
  fetchToday() {
    return this._fetchData(common.TODAY);
  }
  
  fetchYesterday() {
    return this._fetchData(common.YESTERDAY);
  }
  
  fetchMultiple(dataTypes) {
    return this._fetchData(dataTypes);
  }
 
  /**** PRIVATE FUNCTIONS ****/
  _loadFromFile() {
    try {
      return readFileSync(common.STORED_DATA_FILE, "cbor");
    } catch (e) {}
    return {};
  }
  
  _storeInFile(data) {
    try {
      writeFileSync(common.STORED_DATA_FILE, data, "cbor");
    } catch (e) {
    }
  }
  
  _fetchData(dataTypes) {
    dataTypes = this._apiData.toArray(dataTypes);
    let anyOutOfDate = this._apiData.outOfDate(dataTypes);
    
    if (anyOutOfDate) {
      //get fresh data
      if (peerSocket.readyState === peerSocket.OPEN) {
        // Send a command to the companion
        let message = {};
        let params = {};
        for (let i = 0; i < dataTypes.length; i++) {
          params[dataTypes[i]] = true;
        }
        message[common.MESSAGE_KEY] = params;
        peerSocket.send(message);
      }
      else {
        if(this.onerror) this.onerror("No connection with the companion");
      }
    }
    
    //return previous data
    if(!anyOutOfDate && this.onsuccess) {
      //max age not reached, so also fire onsuccess callback
      for (let i = 0; i < dataTypes.length; i++) {
        this.onsuccess(dataTypes[i], this._apiData.get(dataTypes[i]));
      }
    }
    return this._apiData.get(dataTypes);
  }
  
  _parseIncomingMsg(msg) {
    if (msg) {
      for (var dataType in msg) {
        if (dataType == 'error' && this.onerror) {
          this.onerror(msg[dataType]);
          return;
        }
        
        //store new data
        this._apiData.set(dataType, msg[dataType]);
        
        //fire success event
        if (this.onsuccess) {
          this.onsuccess(dataType, this._apiData.get(dataType));
        }
      }
    }
  }  
};

const MY_FILE_NAMES = [common.MESSAGE_DATA_FILE];

let otherFiles = [];
let myFiles    = [];

const prevNextFile = inbox.nextFile;

inbox.nextFile = function() {
  if(otherFiles.length > 0) {
    return otherFiles.pop();
  }
  
  var fileName;
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      myFiles.push(fileName);
    }
    else {
      return fileName;
    }
  }
  return undefined;
}

const getCustomFile = function() {
  if(myFiles.length > 0) {
    return myFiles.pop();
  }
  
  var fileName;
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      return fileName;
    }
    otherFiles.push(fileName);
  }
  return undefined;
}