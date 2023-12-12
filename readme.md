
**Replace the url provided by movement subnet in const.js**


```javascript
const aptos = require("aptos");
// //You can also use https://devnet.m1.movementlabs.xyz/v1 instead
const NODE_URL = "https://127.0.0.1:3001/v1";
const client = new aptos.AptosClient(NODE_URL);
```