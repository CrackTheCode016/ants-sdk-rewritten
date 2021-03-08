import { expect } from "chai";
import { DataPoint, DataPointDTO } from "../../src/models/DataPoint";

const datapointDTO: DataPointDTO = {
  key: "key",
  value: 123,
};

describe("Datapoint Test", () => {
  it("should create a datapoint", () => {
    const datapoint = new DataPoint("key", 123);

    expect(datapoint).to.not.be.undefined;
    expect(datapoint.key).to.equal("key");
    expect(datapoint.value).to.equal(123);
  });

  it("should create a datapoint from a DTO", () => {
    const datapoint = DataPoint.fromDTO(datapointDTO);

    expect(datapoint).to.not.be.undefined;
    expect(datapoint.key).to.equal("key");
    expect(datapoint.value).to.equal(123);
  });

  it("should convert a datapoint to a DTO", () => {
    const datapoint = new DataPoint("key", 123);
    const datapointObj = datapoint.toDTO();

    expect(JSON.stringify(datapointObj)).to.be.equal(
      JSON.stringify(datapointDTO)
    );
  });
});
