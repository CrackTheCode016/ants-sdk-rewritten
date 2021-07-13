console.log("LOG TO A CONTAINER");
import { LogHttp } from "../../src/infra/LogHttp";
import { adminAccountKey, testNodeURL } from "./testconstants";
import { DataLog } from "../../src/models/Log";
import { Account, NetworkType } from "symbol-sdk";

interface Model {
  name: string;
  age: number;
  children: Array<string>;
}

const data: Model = {
  name: "Caprisun",
  age: 13,
  children: ["lazabuster", "Fred", "Obama", "Mommy", "Derek"],
};

const admin = Account.createFromPrivateKey(
  adminAccountKey,
  NetworkType.TEST_NET
);

const logHttp = new LogHttp(testNodeURL);
const log = new DataLog("schema", "", data);

logHttp.announceLog("mycontainer", log, admin).subscribe((c) => console.log(c));
