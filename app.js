const express = require("express");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
require("express-async-errors");
const cors = require("cors");
const { request } = require("./provider");
const { sleep, getAddress } = require("./utils");
const { PORT } = require("./const");
const app = express();
app.use(
    cors({
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization", "x-aptos-client"],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "application/x.aptos.signed_transaction+bcs" }));
app.set("trust proxy", true);
const router = express.Router();

function parsePage(req) {
    const data = req.query;
    const option = {};
    if (data.limit) option.limit = parseInt(data.limit);
    if (data.start) option.start = data.start;
    return option;
}

function setHeader(header, res) {
    res.setHeader("X-APTOS-BLOCK-HEIGHT", header.block_height);
    res.setHeader("X-APTOS-CHAIN-ID", header.chain_id);
    res.setHeader("X-APTOS-EPOCH", header.epoch);
    res.setHeader("X-APTOS-LEDGER-OLDEST-VERSION", header.ledger_oldest_version);
    res.setHeader("X-APTOS-LEDGER-TIMESTAMPUSEC", header.ledger_timestamp_usec);
    res.setHeader("X-APTOS-LEDGER-VERSION", header.ledger_version);
    res.setHeader("X-APTOS-OLDEST-BLOCK-HEIGHT", header.oldest_block_height);
    if (header.cursor) {
        res.setHeader("X-APTOS-CURSOR", header.cursor);
    }
}

router.get("/transactions", async (req, res) => {
    const option = parsePage(req);
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getTransactions", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/transactions", async (req, res) => {
    const body = Buffer.from(req.body).toString("hex");
    let option = { data: body };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("submitTransaction", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/transactions/batch", async (req, res) => {
    const body = Buffer.from(req.body).toString("hex");
    let option = { data: body };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("submitTransactionBatch", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/transactions/by_hash/:txn_hash", async (req, res) => {
    let txn_hash = req.params.txn_hash;
    if (txn_hash.startsWith("0x")) txn_hash = txn_hash.slice(2);
    let option = {
        data: txn_hash,
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getTransactionByHash", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/transactions/by_version/:txn_version", async (req, res) => {
    let txn_version = req.params.txn_version;
    let option = {
        version: txn_version,
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getTransactionByVersion", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/transactions", async (req, res) => {
    const address = req.params.address;
    const page = parsePage(req);
    let option = {
        data: address,
        ...page,
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccountsTransactions", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/transactions/simulate", async (req, res) => {
    const body = Buffer.from(req.body).toString("hex");
    let option = { data: body };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("simulateTransaction", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/estimate_gas_price", async (req, res) => {
    const result = await request("estimateGasPrice");
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address", async (req, res) => {
    let option = {};
    option.data = req.params.address;
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccount", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/resources", async (req, res) => {
    const page = parsePage(req);
    let option = {
        ...page,
    };
    option.data = req.params.address;
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;

    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccountResources", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/modules", async (req, res) => {
    const page = parsePage(req);
    let option = {
        ...page,
    };
    option.data = req.params.address;
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccountModules", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/resource/:resource_type", async (req, res) => {
    const address = req.params.address;
    let resource_type = req.params.resource_type;
    if (resource_type === "0x1::coin::CoinStore<0x1::aptos_coin::MVMTCoin>") {
        resource_type = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
    }
    if (resource_type === "0x1::coin::CoinInfo<0x1::aptos_coin::MVMTCoin>") {
        resource_type = "0x1::coin::CoinInfo<0x1::aptos_coin::AptosCoin>";
    }
    let option = { account: address, resource: resource_type };
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccountResourcesState", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/module/:module_name", async (req, res) => {
    const address = req.params.address;
    const module_name = req.params.module_name;
    let option = {
        account: address,
        resource: module_name,
    };
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getAccountModulesState", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/blocks/by_height/:height", async (req, res) => {
    const height = req.params.height;
    const option = { with_transactions: false };
    const query = req.query;
    if (query.with_transactions?.toString() === "true") {
        option.with_transactions = true;
    }
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    option.height_or_version = parseInt(height);
    const result = await request("getBlockByHeight", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/blocks/by_version/:version", async (req, res) => {
    const version = req.params.version;

    const option = { with_transactions: false };
    if (req.query.with_transactions?.toString() === "true") {
        option.with_transactions = true;
    }
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    option.height_or_version = parseInt(version);
    const result = await request("getBlockByVersion", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/view", async (req, res) => {
    const body = req.body;
    let option = {
        data: JSON.stringify(body),
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("viewFunction", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/tables/:table_handle/item", async (req, res) => {
    const body = req.body;
    const table_handle = req.params.table_handle;
    let option = {
        query: table_handle,
        body: JSON.stringify(body),
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    const result = await request("getTableItem", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.post("/tables/:table_handle/raw_item", async (req, res) => {
    const body = req.body;
    const table_handle = req.params.table_handle;
    let option = {
        query: table_handle,
        body: JSON.stringify(body),
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    if (req.query.ledger_version) option.ledger_version = "" + req.query.ledger_version;
    const result = await request("getRawTableItem", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/events/:creation_number", async (req, res) => {
    const page = parsePage(req);
    const address = req.params.address;
    const creation_number = req.params.creation_number;
    let option = {
        ...page,
        address,
        creation_number,
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getEventsByCreationNumber", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/accounts/:address/events/:event_handle/:field_name", async (req, res) => {
    const page = parsePage(req);
    const address = req.params.address;
    const event_handle = req.params.event_handle;
    const field_name = req.params.field_name;
    let option = {
        ...page,
        address,
        event_handle,
        field_name,
    };
    if (req.is_bcs_format) {
        option.is_bcs_format = true;
    }
    const result = await request("getEventsByEventHandle", option);
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/", async (req, res) => {
    const result = await request("getLedgerInfo");
    const { data, header } = result;
    setHeader(header, res);
    res.sendData(data);
});

router.get("/-/healthy", async (req, res) => {
    res.sendData({ message: "success" });
});

router.post("/mint", async (req, res) => {
    let ret = [];
    let address = req.query.address.slice(2);
    try {
        // check the account is exist
        await request("getAccountResourcesState", {
            account: req.query.address,
            resource: "0x1::coin::CoinInfo<0x1::aptos_coin::AptosCoin>",
        });
    } catch (error) {
        await request("createAccount", { data: address });
        await sleep(3);
    }
    let faucet_res = await request("faucet", { data: address });
    await sleep(1);
    ret.push(faucet_res.data.hash);
    res.sendData(ret);
});

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const bcs_formatter = (req, res, next) => {
    let is_bcs_format = false;
    let accepts = req.headers["accept"];
    let bcs = "application/x-bcs";
    if (accepts) {
        accepts = accepts.split(",");
        if (accepts.includes(bcs)) {
            is_bcs_format = true;
        }
    }
    req.is_bcs_format = is_bcs_format;
    res.sendData = (data) => {
        if (req.is_bcs_format) {
            let buffer = Buffer.from(data, "hex");
            res.setHeader("Content-Type", bcs);
            res.send(buffer);
        } else {
            res.send(data);
        }
    };
    next();
};

app.use("/v1", bcs_formatter, router);

app.use((err, req, res, next) => {
    console.error("err", req.originalUrl, req.method, err.message);
    res.status(404);
    res.json({
        error_code: "account_not_found",
        message: "A message describing the error",
    });
});
app.listen(PORT, () => {
    console.log(` app listening on port ${PORT}`);
});
