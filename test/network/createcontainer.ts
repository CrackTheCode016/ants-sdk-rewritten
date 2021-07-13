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
import {
  testNodeURL,
  ownerAccountKey,
  adminAccountKey,
  targetAccountKey,
} from "./testconstants";

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

const initalOwner = Account.createFromPrivateKey(
  ownerAccountKey,
  NetworkType.TEST_NET
);
const admin = Account.createFromPrivateKey(
  adminAccountKey,
  NetworkType.TEST_NET
);
const targetAccount = Account.createFromPrivateKey(
  targetAccountKey,
  NetworkType.TEST_NET
);

const timestamp = new Date();
const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);

const container = new Container(
  "mycontainer",
  state,
  [admin.address],
  schema,
  targetAccount.publicAccount.address
);

console.log(
  "INITAL OWNER INFO: ",
  initalOwner.privateKey + "\n",
  initalOwner.publicKey + "\n",
  initalOwner.address.plain()
);
console.log(
  "TARGET ACCOUNT INFO: ",
  targetAccount.privateKey + "\n",
  targetAccount.publicKey + "\n",
  targetAccount.address.plain()
);
console.log(
  "ADMIN ACCOUNT INFO: ",
  admin.privateKey + "\n",
  admin.publicKey + "\n",
  admin.address.plain()
);

containerHttp
  .publishContainer(container, initalOwner, targetAccount)
  .pipe(
    mergeMap((_) => containerHttp.getContainerByName("mycontainer", "schema"))
  )
  .subscribe((r) => {
    console.log(r);
  });
