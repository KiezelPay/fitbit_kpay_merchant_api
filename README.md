# K·pay merchant API module for Fitbit OS

Library to get the data available via the K·pay merchant API and use it in an app or clockface (https://kiezelpay.com/api/merchant/documentation/).

Many thanks to Grégoire Sage for letting me use his awesome <a href="https://github.com/gregoiresage/fitbit-weather" target="_blank">weather module</a> as basis for this code!

## Usage

Copy the *common/kpay_merchant_api* folder in your *common* folder

### Companion

Create an *index.js* file in the *companion* folder if you don't already have one.  
Add the following code in this file :

```javascript
import KpayMerchantApi from '../common/kpay_merchant_api/phone';
let kpayMerchantApi = new KpayMerchantApi();

//replace this test API key with your own API key!
kpayMerchantApi.setApiKey('0123456789abcdef0123456789abcdef');
```

### App

Add the following code in your *app/index.js* file

```javascript
import KpayMerchantApi from '../common/kpay_merchant_api/device';
import { SUMMARY, TODAY, YESTERDAY } from '../common/kpay_merchant_api/common';

let kpayMerchantApi = new KpayMerchantApi();
weather.setMaximumAge(30 * 60 * 1000);    //only get new data every 30 minutes

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

//either fetch only one specific data type you want
kpayMerchantApi.fetchSummary();
//kpayMerchantApi.fetchToday();
//kpayMerchantApi.fetchYesterday();

//OR fetch all the data you want at once
//kpayMerchantApi.fetchMultiple([SUMMARY, TODAY, YESTERDAY]);
```

## API
* **setApiKey(string)** : set your K·pay API key (companion only). You can get your personal key at <a href="https://kiezelpay.com/account/api" target="_blank">https://kiezelpay.com/account/api</a>. Default is ``
* **setMaximumAge(int)** : set the maximum age in milliseconds of a possible cached sales data that is acceptable to return. Default is `15*60*1000` (15 minutes)
* **onsuccess(type, data)** : set the event handler for when new sales data is available. The type can be SUMMARY, TODAY or YESTERDAY (import values from '/common/kpay_merchant_api/common.js')
* **onerror(error)** : set the event handler for when an error occurs
* **fetchSummary(), fetchToday(), fetchYesterday()** : retrieve one specific kind of data from the server
* **fetchMultiple([])** : retrieve multiple kinds of data from the server, accepts an array with any combination of the following values: SUMMARY, TODAY, YESTERDAY. The success event handler is called once for EACH of the types when that specific type's data arrives.
* **getSummary(), getToday(), getYesterday()** : returns the last known api data. This can be useful to display the data when your app/face starts. The old data is automatically stored by the library and restored when the kpayMerchantApi object is created.

## Example of results
* Summary:
```json
  {
    "totalPurchases": 5074,
    "totalActiveTrials": 280,
    "totalIncome": 3653.28,
    "totalPaidOut": 2098.8,
    "currentBalance": 1554.48,
    "nextPayout": {
      "date": "2018-04-26",
      "amount": 1554.48,
      "purchases": {
        "total": 2159,
        "periodStart": "2018-03-16",
        "periodEnd": "2018-04-12"
      }
    },
    "previousPayout": {
      "date": "2018-03-29",
      "amount": 2058.48,
      "purchases": {
        "total": 2859,
        "periodStart": "2018-02-09",
        "periodEnd": "2018-03-15"
      }
    }
  }
```
* Today & Yesterday:
```json
  {
    "you": {
      "purchases": 70,
      "amount": 50.4
    },
    "best": {
      "purchases": 61,
      "amount": 43.92
    }
  }
```

For more API documentation check out <a href="https://kiezelpay.com/api/merchant/documentation" target="_blank">https://kiezelpay.com/api/merchant/documentation</a>.