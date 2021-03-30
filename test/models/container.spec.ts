import {
  ArraySchema,
  NumberSchema,
  Schema,
  StringSchema,
} from "@justeat/ts-jsonschema-builder";
import { expect } from "chai";
import { Account, NetworkType } from "symbol-sdk";
import { Container, ContainerDTO } from "../../src/models/Container";
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

const schemaTemplate = new Schema<Model>()
  .with((m) => m.name, new StringSchema())
  .with((m) => m.age, new NumberSchema())
  .with((m) => m.children, new ArraySchema());

const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);

describe("Container Test", () => {
  it("should create a valid container", () => {
    const timestamp = new Date();
    const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);
    const targetAccount = Account.createFromPrivateKey(
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
      NetworkType.TEST_NET
    );
    const container = new Container(
      "container",
      state,
      [targetAccount.address],
      schema,
      targetAccount.publicAccount.address
    );
    expect(container).to.not.be.undefined;
    expect(container.name).to.be.equal("container");
    expect(container.state.status).to.be.equal(ContainerStatus.ACTIVE);
    expect(container.state.latestLogHash).to.be.equal("");
    expect(container.schema.schemaName).to.be.equal("schema");
    expect(container.authorizedReporters.length).to.be.equal(1);
    expect(container.authorizedReporters[0].pretty()).to.be.equal(
      targetAccount.address.pretty()
    );
  });

  it("should create a container from a DTO", () => {
    const timestamp = new Date();
    const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);
    const targetAccount = Account.createFromPrivateKey(
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
      NetworkType.TEST_NET
    );
    const container = new Container(
      "container",
      state,
      [targetAccount.address],
      schema,
      targetAccount.publicAccount.address
    );
    const dto = container.toDTO();
    const newContainer = Container.fromDTO(dto);
    expect(newContainer.name).to.be.equal(container.name);
    expect(newContainer.state.lastTimestamp).to.be.equal(
      container.state.lastTimestamp
    );
    expect(newContainer.state.latestLogHash).to.be.equal(
      container.state.latestLogHash
    );
    expect(newContainer.state.status).to.be.equal(container.state.status);
    expect(newContainer.targetAccount.plain()).to.be.equal(
      container.targetAccount.plain()
    );
  });

  it("should throw on having duplicate reporters", () => {
    const timestamp = new Date();
    const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);
    const targetAccount = Account.createFromPrivateKey(
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
      NetworkType.TEST_NET
    );

    expect(
      () =>
        new Container(
          "container",
          state,
          [targetAccount.address, targetAccount.address],
          schema,
          targetAccount.publicAccount.address
        )
    ).to.throw();
  });

  it("should convert a container to a DTO", () => {
    const timestamp = new Date();
    const state = new ContainerState(timestamp, "", ContainerStatus.ACTIVE);
    const targetAccount = Account.createFromPrivateKey(
      "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
      NetworkType.TEST_NET
    );
    const container = new Container(
      "container",
      state,
      [targetAccount.address],
      schema,
      targetAccount.publicAccount.address
    );
    const dto = container.toDTO();
    expect(dto).to.not.be.undefined;
    expect(dto.name).to.be.equal("container");
    expect(dto.targetAccount.plain()).to.be.equal(
      targetAccount.address.plain()
    );
    expect(dto.state.status).to.be.equal(ContainerStatus.ACTIVE);
    expect(dto.state.latestLogHash).to.be.equal("");
    expect(dto.schema.schemaName).to.be.equal("schema");
    expect(dto.authorizedReporters.length).to.be.equal(1);
    expect(dto.authorizedReporters[0].pretty()).to.be.equal(
      targetAccount.address.pretty()
    );
  });
});
