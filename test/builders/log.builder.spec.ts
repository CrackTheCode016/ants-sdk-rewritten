import { expect } from "chai";
import {
  Account,
  NamespaceMetadataTransaction,
  NetworkType,
  Transaction,
  TransactionType,
  TransferTransaction,
} from "symbol-sdk";
import { LogBuilder } from "../../src/builders/LogBuilder";
import {
  ContainerState,
  ContainerStatus,
} from "../../src/models/ContainerState";
import { DataLog } from "../../src/models/Log";

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

const testLog = new DataLog("schema", "none", reportData);

const targetAccount = Account.createFromPrivateKey(
  "CC69FAC38D62DA6D2CC4D72D58B85D4FF2F7F78B56F1CCFB8782F3AA6476F829",
  NetworkType.TEST_NET
);
describe("Log Transaction Builder Test", () => {
  it("should create a log transaction", () => {
    const logBuilder = new LogBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "B626827FBD912D95931E03E9718BFE8FFD7D316E9FBB5416ED2B3C072EA32406"
    );

    const logTransaction = logBuilder.createLog(
      testLog,
      targetAccount,
      targetAccount.address
    );

    const underlying = logTransaction.underlyingTransaction
      .innerTransactions as TransferTransaction[];

    const headTransaction = underlying[0];
    const logContent = underlying[1];

    const log = DataLog.fromDTO(JSON.parse(logContent.message.payload));

    expect(underlying.length).to.be.greaterThan(1);
    expect(JSON.stringify(log.data)).to.be.equal(JSON.stringify(reportData));
    expect(headTransaction.message.payload).to.be.equal("REPORT-schema");
  });

  it("should create a log transaction with a state change", () => {
    const logBuilder = new LogBuilder(
      "http://localhost:3000",
      NetworkType.TEST_NET,
      0,
      "B626827FBD912D95931E03E9718BFE8FFD7D316E9FBB5416ED2B3C072EA32406"
    );

    const oldState = new ContainerState(new Date(), "", ContainerStatus.LOCKED);

    const logWithStateChange = logBuilder.createLogWithStateChange(
      "container",
      testLog,
      targetAccount,
      targetAccount.address,
      targetAccount.publicAccount,
      [],
      oldState,
      ContainerStatus.ACTIVE
    );

    const underlying =
      logWithStateChange.underlyingTransaction.innerTransactions;

    const headTransaction = underlying[0] as TransferTransaction;
    const logContent = underlying[1] as TransferTransaction;
    const stateChange = underlying[2] as NamespaceMetadataTransaction;

    const log = DataLog.fromDTO(JSON.parse(logContent.message.payload));

    expect(logWithStateChange.underlyingTransaction.type).to.be.equal(
      TransactionType.AGGREGATE_BONDED
    );
    expect(underlying.length).to.be.greaterThan(2);
    expect(JSON.stringify(log.data)).to.be.equal(JSON.stringify(reportData));
    expect(headTransaction.message.payload).to.be.equal("REPORT-schema");
    expect(stateChange.type).to.be.equal(TransactionType.NAMESPACE_METADATA);
  });
});
