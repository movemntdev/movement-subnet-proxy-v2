
**Replace the URL provided by movement subnet in const.js,You can found at [subnet](https://github.com/movemntdev/movement-subnet-v2)**


### Start server

```bash
 node app.js
```

### Interact with subnet

```javascript
const aptos = require("aptos");
const NODE_URL = "https://127.0.0.1:3001/v1";
const client = new aptos.AptosClient(NODE_URL);
```