import { peerSocket } from "messaging";
import { outbox } from "file-transfer";
import { localStorage } from "local-storage";
import * as cbor from "cbor";

import * as common from './common.js';
import KpayMerchantApiData from './data.js';

export default class KpayMerchantApi {
  
  constructor() {
    this._apiData = new KpayMerchantApiData(this._loadFromStorage, this._storeInStorage);
    
    this._apiKey = undefined;
    this.onerror = undefined;
    this.onsuccess = undefined;
    
    this._internalOnSuccess = (dataType, data) => {
      //received some data
      console.log(`KPay Merchant API '${dataType}' data received: ${JSON.stringify(data)}`);

      //store new data
      this._apiData.set(dataType, data);

      //fire success event
      let successData = this._apiData.get(dataType);
      if (this.onsuccess) {
        this.onsuccess(dataType, successData);
      }

      //send it the watch
      outbox
        .enqueue(common.MESSAGE_DATA_FILE, cbor.encode(successData))
        .catch(error => console.log(`Error sending KPay Merchant API '${dataType}' data to watch: ${error}`));
    };
    
    this._internalOnError = (dataType, error) => {
      //error getting data
      let errorMsg = `Error getting KPay Merchant API '${dataType}' data: ${error}`;
      console.log(errorMsg);

      if (this.onerror) {
        this.onerror(errorMsg);
      }

      //send error to the watch
      outbox
        .enqueue(common.MESSAGE_DATA_FILE, cbor.encode({ error: errorMsg }))
        .catch(error => console.log("Error sending KPay Merchant API error to watch: " + error));
    };
    
    peerSocket.addEventListener("message", (evt) => {
      // We are receiving a request from the app
      if (evt.data && evt.data[common.MESSAGE_KEY]) {
        let msg = evt.data[common.MESSAGE_KEY];
        
        //check which data types we need to get from the api
        let dataTypesToGet = [];
        for (var dataType in msg) {
          if (msg.hasOwnProperty(dataType) && msg[dataType]) {
            dataTypesToGet.push(dataType);
          }
        }
              
        //get the data
        prv_fetchRemote(dataTypesToGet, this._apiKey, this._internalOnSuccess, this._internalOnError);
      }
    });
  }
  
  setMaximumAge(maximumAge) {
    this._apiData.setMaximumAge(maximumAge);
  }
  
  setApiKey(apiKey) {
    this._apiKey = apiKey;
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
  _loadFromStorage() {
    try {
      let dataAsString = localStorage.getItem(common.STORED_DATA_FILE);
      if (dataAsString) {
        return JSON.parse(dataAsString);
      }
    } catch (e) {}
    return {};
  }
  
  _storeInStorage(data) {
    try {
      localStorage.setItem(common.STORED_DATA_FILE, JSON.stringify(data));
    } catch (e) {
    }
  }
  
  _fetchData(dataTypes) {
    dataTypes = this._apiData.toArray(dataTypes);
    let anyOutOfDate = this._apiData.outOfDate(dataTypes);
    
    if (anyOutOfDate) {
      //get fresh data
      prv_fetchRemote(dataTypes, this._apiKey, this._internalOnSuccess, this._internalOnError);
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
};

/*******************************************/
/*********** PRIVATE FUNCTIONS  ************/
/*******************************************/

var prv_fetch_functions = [];
prv_fetch_functions[common.SUMMARY] = prv_fetchRemoteSummary;
prv_fetch_functions[common.TODAY] = prv_fetchRemoteToday;
prv_fetch_functions[common.YESTERDAY] = prv_fetchRemoteYesterday;

function prv_fetchRemote(dataTypes, apiKey, success, error) {
  if (!apiKey) {
    console.log("ERROR: KPay Merchant API apikey not set! Cannot fetch data without valid apikey!");
    return;
  }
  if (apiKey == '0123456789abcdef0123456789abcdef') {
    console.log("WARNING: test api key with random data is used, replace with your own api key for real data!");
  }
  
  //fetch all requested data
  for (let i = 0; i < dataTypes.length; i++) {
    prv_fetch_functions[dataTypes[i]](apiKey, success, error);
  }
}

function prv_fetchRemoteSummary(apiKey, success, error) {
  console.log('Fetching KPay Merchant API \'summary\' data from KPay servers...');
  var url = 'https://kiezelpay.com/api/merchant/summary?key=' + apiKey;
  prv_fetchAndSend(common.SUMMARY, url, success, error);
}

function prv_fetchRemoteToday(apiKey, success, error) {
  console.log('Fetching KPay Merchant API \'today\' data from KPay servers...');
  var url = 'https://kiezelpay.com/api/merchant/today?key=' + apiKey + '&offset=' + (new Date()).getTimezoneOffset();
  prv_fetchAndSend(common.TODAY, url, success, error);
}

function prv_fetchRemoteYesterday(apiKey, success, error) {
  console.log('Fetching KPay Merchant API \'yesterday\' data from KPay servers...');
  var url = 'https://kiezelpay.com/api/merchant/yesterday?key=' + apiKey + '&offset=' + (new Date()).getTimezoneOffset();
  prv_fetchAndSend(common.YESTERDAY, url, success, error);
}

function prv_fetchAndSend(dataType, url, success, error) {
  //get data
  fetch(url)
    .then((response) => {return response.json()})
    .then((data) => { 
      success(dataType, data);
    })
    .catch((err) => { 
      error(dataType, err);
    });
}