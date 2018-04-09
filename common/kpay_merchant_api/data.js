import * as common from './common.js';

export default class KpayMerchantApiData {
  
  constructor(loadFromFile, storeInFile) {
    this._maximumAge = 15*60*1000;
    this._loadFromFile = loadFromFile;
    this._storeInFile = storeInFile;
    if (this._loadFromFile) {
      this._salesData = this._loadFromFile();
    }
    else {
      this._salesData = {};
    }
  }
  
  setMaximumAge(maximumAge) {
    if (maximumAge < 15*60*1000) {
      maximumAge = 15*60*1000;    //no less then 15 minutes!
    }
    this._maximumAge = maximumAge;
  }
  
  set(dataType, data) {
    if (!data.timestamp) {
      data.timestamp = new Date().getTime();
    }
    this._salesData[dataType] = data;
    if (this._storeInFile) {
      this._storeInFile(this._salesData);
    }
  }
  
  get(dataTypes) {
    if (!dataTypes) return undefined;
    dataTypes = this.toArray(dataTypes);
    
    let data = {};
    for (let i = 0; i < dataTypes.length; i++) {
      data[dataTypes[i]] = (this._salesData && 
                            this._salesData.hasOwnProperty(dataTypes[i]) && 
                            this._salesData[dataTypes[i]]) ? this._salesData[dataTypes[i]] : undefined;
    }
    return data;
  }
  
  outOfDate(dataTypes) {
    if (!dataTypes) return undefined;
    dataTypes = this.toArray(dataTypes);
    
    let now = new Date().getTime();
    for (let i = 0; i < dataTypes.length; i++) {
      let currentData = this.get(dataTypes[i])[dataTypes[i]];
      if(!currentData || !currentData.timestamp || (now - currentData.timestamp >= this._maximumAge)) {
        return true;
      }
    }
    return false;
  }
  
  toArray(data) {
    if (data.constructor === Array)
      return data;
    
    return [data];
  }
};
