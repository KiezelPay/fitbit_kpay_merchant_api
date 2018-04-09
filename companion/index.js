// Import the api module
import KpayMerchantApi from '../common/kpay_merchant_api/phone';
import { SUMMARY, TODAY, YESTERDAY } from '../common/kpay_merchant_api/common';

// Create the api object
// this is always needed to answer the device's requests
let kpayMerchantApi = new KpayMerchantApi();
kpayMerchantApi.setApiKey('0123456789abcdef0123456789abcdef');


// You can also fetch the sales data from the companion directly 
// The api is the same as the device's one
/*
// set the maximum age of the data
kpayMerchantApi.setMaximumAge(15 * 60 * 1000); 

// Display the sales data received from the companion
kpayMerchantApi.onsuccess = (type, data) => {
  let receivedData = undefined;
  if (type == SUMMARY) {
    receivedData = data[SUMMARY];
  }
  if (type == TODAY) {
    receivedData = data[TODAY];
  }
  if (type == YESTERDAY) {
    receivedData = data[YESTERDAY];
  }
  
  if (receivedData) {
    console.log(type + ' data: ' + JSON.stringify(receivedData));
  }
}

kpayMerchantApi.onerror = (error) => {
  console.log("KPay Merchant API error: " + error);
}

kpayMerchantApi.fetchSummary();
kpayMerchantApi.fetchToday();
kpayMerchantApi.fetchYesterday();
kpayMerchantApi.fetchMultiple([SUMMARY, TODAY, YESTERDAY]);
*/


