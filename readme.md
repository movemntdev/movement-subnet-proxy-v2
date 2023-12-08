
**Replace the url provided by subnet in const.js**

```javascript
const aptos = require("aptos");
const NODE_URL = "https://127.0.0.1:3001/v1";
const client = new aptos.AptosClient(NODE_URL);
```