const fetch = require("node-fetch");
const { URL } = require("./const");
let counter = 1;
function request(method, ...params) {
    counter++;
    const rpcData = {
        jsonrpc: "2.0",
        method: method,
        params: [...params],
        id: counter,
    };
    let body = JSON.stringify(rpcData);
    console.log("-------rpcData-----", body);
    return fetch(URL, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
    })
        .then((response) => {
            // return response.text();
            return response.json();
        })
        .then((res) => {
            // res = JSON.parse(res);
            if (res.error) {
                console.error("------error----", res);
            }
            let result = res.result;
            let data = result.data;
            try {
                // if not bsc so parse to json
                data = JSON.parse(result.data);
            } catch (error) {
                console.log("-err---", error);
            }
            let ret = {
                data,
                header: JSON.parse(result.header),
            };
            return ret;
        });
}
module.exports = { request };
