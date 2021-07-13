console.log("CHANGE A SCHEMA ON AN EXISTING CONTAINER");
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
import { testNodeURL, ownerAccountKey } from "./testconstants";

console.log("PUBLISHING AND RETRIEVING A CONTAINER ");

interface Model {
  name: string;
  age: number;
  dob: string;
  children: Array<string>;
}

const ownerAccount = Account.createFromPrivateKey(
  ownerAccountKey,
  NetworkType.TEST_NET
);

const schemaTemplate = new Schema<Model>()
  .with((m) => m.name, new StringSchema())
  .with((m) => m.age, new NumberSchema())
  .with((m) => m.dob, new StringSchema())
  .with((m) => m.children, new ArraySchema());

const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);

const containerHttp = new ContainerHttp(testNodeURL);

containerHttp
  .editContainerSchema(ownerAccount, "mycontainer", schema, "schema")
  .subscribe((c) => console.log(c));
