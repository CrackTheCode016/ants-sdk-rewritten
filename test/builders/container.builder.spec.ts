import {
  ArraySchema,
  NumberSchema,
  Schema,
  StringSchema,
} from "@justeat/ts-jsonschema-builder";
import { expect } from "chai";
import {
  Account,
  AliasTransaction,
  Convert,
  KeyGenerator,
  MultisigAccountModificationTransaction,
  NamespaceId,
  NamespaceMetadataTransaction,
  NamespaceRegistrationTransaction,
  NetworkType,
  TransactionType,
} from "symbol-sdk";
import { ContainerBuilder } from "../../src/builders/ContainerBuilder";
import { SCHEMA_NAME_PREFIX } from "../../src/constants";
import { Container } from "../../src/models/Container";
import {
  ContainerState,
  ContainerStatus,
} from "../../src/models/ContainerState";
import { DataSchema } from "../../src/models/Schema";

interface Model {
  name: string;
  age: number;
  children: Array<string>;
}

interface newModel {
  name: string;
  age: number;
  weight: number;
  children: Array<string>;
}

const schemaTemplate = new Schema<Model>()
  .with((m) => m.name, new StringSchema())
  .with((m) => m.age, new NumberSchema())
  .with((m) => m.children, new ArraySchema());

const newSchemaTemplate = new Schema<newModel>()
  .with((m) => m.name, new StringSchema())
  .with((m) => m.age, new NumberSchema())
  .with((m) => m.weight, new NumberSchema())
  .with((m) => m.children, new ArraySchema());

const testTargetAccount = Account.createFromPrivateKey(
  "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
  NetworkType.TEST_NET
);

const timestamp = new Date();
const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);
const targetAccount = Account.createFromPrivateKey(
  "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
  NetworkType.TEST_NET
);
const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
const newSchema = new DataSchema("schema", 0, ["0x", "0x1"], newSchemaTemplate);
const container = new Container(
  "container",
  state,
  [targetAccount.address],
  schema,
  targetAccount.publicAccount.address
);

describe("Container Transaction Builder Test", () => {
  it("create a valid container ownership scheme", () => {
    const containerBuilder = new ContainerBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829"
    );

    const ownershipAssignment = containerBuilder.createContainerOwnership(
      testTargetAccount,
      [],
      1,
      1
    );

    const underlying = ownershipAssignment.underlyingTransaction;
    const modificationTransaction = underlying
      .innerTransactions[0] as MultisigAccountModificationTransaction;

    expect(underlying.innerTransactions.length).to.be.equal(1);
    expect(modificationTransaction.type).to.be.equal(
      TransactionType.MULTISIG_ACCOUNT_MODIFICATION
    );
    expect(modificationTransaction.minApprovalDelta).to.be.equal(1);
    expect(modificationTransaction.minRemovalDelta).to.be.equal(1);
  });

  it("create a valid container metadata assignment", () => {
    const containerBuilder = new ContainerBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829"
    );

    const metadataAssignment = containerBuilder.createContainerMetaAssignment(
      container,
      targetAccount
    );
    const underlying = metadataAssignment.underlyingTransaction;
    const aliasTransaction = underlying
      .innerTransactions[0] as AliasTransaction;
    const namespaceRegistration = underlying
      .innerTransactions[1] as NamespaceRegistrationTransaction;

    expect(underlying.innerTransactions.length).to.be.equal(2);
    expect(aliasTransaction.type).to.be.equal(TransactionType.ADDRESS_ALIAS);
    expect(namespaceRegistration.type).to.be.equal(
      TransactionType.NAMESPACE_REGISTRATION
    );
    expect(namespaceRegistration.namespaceId.plain()).to.be.equal(
      new NamespaceId(container.name).plain()
    );
  });

  it("add a schema to a container (via metadata)", () => {
    const containerBuilder = new ContainerBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829"
    );
    const schemaAssignment = containerBuilder.addSchemaToContainer(
      container.name,
      container.schema,
      targetAccount
    );
    const key = KeyGenerator.generateUInt64Key(
      SCHEMA_NAME_PREFIX + schema.schemaName
    );
    const underlying = schemaAssignment.underlyingTransaction;
    const namepsaceMetadataAssignment = underlying
      .innerTransactions[0] as NamespaceMetadataTransaction;

    expect(underlying.innerTransactions.length).to.be.equal(1);
    expect(namepsaceMetadataAssignment.type).to.be.equal(
      TransactionType.NAMESPACE_METADATA
    );
    expect(namepsaceMetadataAssignment.scopedMetadataKey.toHex()).to.be.equal(
      key.toHex()
    );
    expect(namepsaceMetadataAssignment.value).to.be.equal(
      JSON.stringify(schema.toDTO())
    );
  });

  it("should create a valid schema update (via metadata)", () => {
    const containerBuilder = new ContainerBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829"
    );

    const key = KeyGenerator.generateUInt64Key(
      SCHEMA_NAME_PREFIX + schema.schemaName
    );

    const updateSchemaAssignment = containerBuilder.updateContainerSchema(
      container.name,
      newSchema,
      schema,
      targetAccount.publicAccount,
      targetAccount
    );

    const underlying = updateSchemaAssignment.underlyingTransaction;
    const namepsaceMetadataAssignment = underlying
      .innerTransactions[0] as NamespaceMetadataTransaction;

    expect(underlying.innerTransactions.length).to.be.equal(1);
    expect(namepsaceMetadataAssignment.type).to.be.equal(
      TransactionType.NAMESPACE_METADATA
    );
    expect(namepsaceMetadataAssignment.scopedMetadataKey.toHex()).to.be.equal(
      key.toHex()
    );
    const newValueBytes = Convert.utf8ToUint8(
      JSON.stringify(newSchema.toDTO())
    );
    const currentValueBytes = Convert.utf8ToUint8(
      JSON.stringify(schema.toDTO())
    );
    expect(namepsaceMetadataAssignment.value).to.be.equal(
      Convert.decodeHex(Convert.xor(currentValueBytes, newValueBytes))
    );
  });
});
