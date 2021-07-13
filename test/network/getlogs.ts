console.log("GET LOGS FROM CONTAINER");
import { LogHttp } from "../../src/infra/LogHttp";
import {
  adminAccountKey,
  targetAccountKey,
  testNodeURL,
} from "./testconstants";
import { DataLog } from "../../src/models/Log";
import { Account, NetworkType } from "symbol-sdk";

interface Model {
  name: string;
  age: number;
  children: Array<string>;
}

const data: Model = {
  name: "Bader",
  age: 20,
  children: ["1", "2", "3", "4", "5", "6"],
};

const targetAccount = Account.createFromPrivateKey(
  targetAccountKey,
  NetworkType.TEST_NET
);

const logHttp = new LogHttp(testNodeURL);

logHttp
  .getLogsAssociatedWithAddress(targetAccount.address, "mycontainer")
  .subscribe((logs) => {
    console.log(logs);
    console.log(logs[1].data);
  });
