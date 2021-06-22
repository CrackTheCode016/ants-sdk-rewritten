import {
  ArraySchema,
  NumberSchema,
  Schema,
  StringSchema,
} from "@justeat/ts-jsonschema-builder";
import { mergeMap } from "rxjs/operators";
import { Account, NetworkType } from "symbol-sdk";
import { ContainerHttp } from "../../src/infra/ContainerHttp";
import { Container } from "../../src/models/Container";
import {
  ContainerState,
  ContainerStatus,
} from "../../src/models/ContainerState";
import { DataSchema } from "../../src/models/Schema";
import { testNodeURL } from "./testconstants";

console.log("PUBLISHING AND RETRIEVING A CONTAINER ");

interface Model {
  name: string;
  age: number;
  children: Array<string>;
}

const schemaTemplate = new Schema<Model>()
  .with((m) => m.name, new StringSchema())
  .with((m) => m.age, new NumberSchema())
  .with((m) => m.children, new ArraySchema());

const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);

const containerHttp = new ContainerHttp(testNodeURL);

const initalOwner = Account.generateNewAccount(NetworkType.TEST_NET);
const targetAccount = Account.generateNewAccount(NetworkType.TEST_NET);
const timestamp = new Date();
const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);

const container = new Container(
  "mycontainer",
  state,
  [targetAccount.address],
  schema,
  targetAccount.publicAccount.address
);

console.log(
  "INITAL OWNER INFO: ",
  initalOwner.privateKey,
  initalOwner.publicKey
);
console.log(
  "TARGET ACCOUNT INFO: ",
  targetAccount.privateKey,
  targetAccount.publicKey
);

containerHttp
  .publishContainer(container, initalOwner, targetAccount)
  .pipe(mergeMap((_) => containerHttp.getContainerByName("mycontainer")))
  .subscribe((r) => {
    console.log(r);
  });

// containerHttp
//   .getContainerByName("mycontainer")
//   .subscribe((c) => console.log(c));
