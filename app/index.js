import document from "document"
import { peerSocket } from "messaging";

// Import the api module
import KpayMerchantApi from '../common/kpay_merchant_api/device';
import { SUMMARY, TODAY, YESTERDAY } from '../common/kpay_merchant_api/common';

// Create the api object
let kpayMerchantApi = new KpayMerchantApi();

let showSalesData = function(type, data){
  let receivedData = undefined;
  if (type == SUMMARY) {
    receivedData = data[SUMMARY];
    
    document.getElementById("totalPurchases").text = receivedData.totalPurchases + " purchases";
    document.getElementById("totalAmount").text = '$' + receivedData.totalIncome + ' USD';
    document.getElementById("nextPayDate").text = receivedData.nextPayout.date;
    document.getElementById("nextPayAmount").text = receivedData.nextPayout.amount;
  }
  if (type == TODAY) {
    receivedData = data[TODAY];
  }
  if (type == YESTERDAY) {
    receivedData = data[YESTERDAY];
  }
  
  if (receivedData) {
    //log part of received data (cannot log it all because of a bug in studio which prevents logging too long messages; summary data cannot be logged completely)
    console.log(type + ' data: ' + JSON.stringify(receivedData).substring(0, 225));
  }
}

// Display the sales data received from the companion
kpayMerchantApi.onsuccess = showSalesData;

kpayMerchantApi.onerror = (error) => {
  console.log("KPay Merchant API error: " + error);
}

let fetchSalesData = function() {
  document.getElementById("totalPurchases").text = "";
  document.getElementById("totalAmount").text = "";
  document.getElementById("nextPayDate").text = "";
  document.getElementById("nextPayAmount").text = "Fetching...";
  
  //either fetch only one specific data type you want
  kpayMerchantApi.fetchSummary();
  //kpayMerchantApi.fetchToday();
  //kpayMerchantApi.fetchYesterday();
  
  //OR fetch all the data you want at once
  //kpayMerchantApi.fetchMultiple([SUMMARY, TODAY, YESTERDAY]);
}

if (peerSocket.readyState === peerSocket.OPEN) {
  //connected already open
  fetchSalesData();
}

// Listen for the onopen event (will only be called if connection isn't open already)
peerSocket.addEventListener("open", (evt) => {
  fetchSalesData();
});