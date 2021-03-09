import {
  ArraySchema,
  NumberSchema,
  Schema,
  StringSchema,
} from "@justeat/ts-jsonschema-builder";
import { expect } from "chai";
import { DataLog } from "../../src/models/Log";
import { DataSchema } from "../../src/models/Schema";

describe("Schema Test", () => {
  interface Model {
    name: string;
    age: number;
    children: Array<string>;
  }
  
  const schemaTemplate = new Schema<Model>()
    .with((m) => m.name, new StringSchema())
    .with((m) => m.age, new NumberSchema())
    .with((m) => m.children, new ArraySchema());

  const sampleModel: Model = {
    name: "name",
    age: 19,
    children: ["louis", "charles", "tom"],
  };

  const sampleBadModel = {
    name: "name",
    age: "19",
    children: ["louis", "charles", "tom"],
  };

  const log = new DataLog("schema", "", sampleModel);
  const badLog = new DataLog("schema", "", sampleBadModel);

  it("should create a new schema", () => {
    const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
    expect(schema).to.be.not.be.undefined;
    expect(schema.schemaName).to.equal("schema");
    expect(schema.bonusRewardPercentage).to.equal(0);
    expect(schema.bonusRewardHexIds.length).to.equal(2);
    expect(schema.schema).to.be.not.be.undefined;
  });

  it("should convert to a string", () => {
    const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
    expect(schema.toString()).to.be.not.be.undefined;
  });

  it("should convert to DTO", () => {
    const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
    const schemaDTO = schema.toDTO();
    expect(schemaDTO).to.be.not.be.undefined;
    expect(schemaDTO.schemaName).to.equal("schema");
    expect(schemaDTO.bonusRewardPercentage).to.equal(0);
    expect(schemaDTO.bonusRewardHexIds.length).to.equal(2);
    expect(schemaDTO.schema).to.be.not.be.undefined;
  });

  it("should validate data against a schema", () => {
    const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
    const validation = DataSchema.validate(log, schema);
    expect(validation).to.be.equal(true);
  });

  it("should throw on recieving invalid data", () => {
    const schema = new DataSchema("schema", 0, ["0x", "0x1"], schemaTemplate);
    const validation = DataSchema.validate(badLog, schema);
    expect(validation).to.be.equal(false);
  });
});
