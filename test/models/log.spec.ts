import { expect } from "chai";
import { Address } from "symbol-sdk";
import { DataPoint, DataPointDTO } from "../../src/models/DataPoint";
import { DataLog, DataLogDTO } from "../../src/models/Log";

interface Model {
  name: string;
  age: number;
  children: Array<string>;
}

const reportData: Model = {
  name: "name",
  age: 19,
  children: ["louis", "charles", "tom"],
};

const dataLogDTO: DataLogDTO = {
  name: "schema",
  source: "source",
  data: reportData,
  timestamp: "0",
};

describe("Log Test", () => {
  it("should create a datalog", () => {
    const log = new DataLog("schema", "source", reportData);

    expect(log).to.not.be.undefined;
    expect(log.data).to.not.be.undefined;
    expect(log.schemaName).to.be.equal("schema");
    expect(log.source).to.be.equal("source");
  });

  it("should convert from a DTO", () => {
    const log = DataLog.fromDTO(
      dataLogDTO,
      "hash",
      Address.createFromRawAddress("SB3KUBHATFCPV7UZQLWAQ2EUR6SIHBSBEOEDDDF")
    );

    expect(log).to.not.be.undefined;
    expect(log.data).to.not.be.undefined;
    expect(log.schemaName).to.be.equal("schema");
    expect(log.source).to.be.equal("source");
    expect(log.hash).to.be.equal("hash");
    expect(log.senderAddress.plain()).to.be.equal(
      "SB3KUBHATFCPV7UZQLWAQ2EUR6SIHBSBEOEDDDF"
    );
    expect(log.timestamp).to.be.equal("0");
  });

  it("should convert to a DTO", () => {
    const log = new DataLog("schema", "source", reportData);
    const logDTO = log.toDTO();

    expect(logDTO).to.not.be.undefined;
    expect(logDTO.name).to.be.equal("schema");
    expect(logDTO.source).to.be.equal("source");
  });

  it("should convert to a JSON schema", () => {
    const log = new DataLog("schema", "source", reportData);
    const schemaData = log.data;
    expect(JSON.stringify(schemaData)).to.be.equal(JSON.stringify(reportData));
  });

  it("should convert to a string", () => {
    const log = new DataLog("schema", "source", reportData);
    log.toString();
    expect(JSON.stringify(log.toDTO())).to.be.equal(log.toString());
  });

  it("should make the log chonky", () => {
    const log = new DataLog("schema", "source", reportData);
    const chunks = log.chunk();
    expect(chunks.length).to.be.equal(1);
  });
});
