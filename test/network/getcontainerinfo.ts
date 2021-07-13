import { ContainerHttp } from "../../src/infra/ContainerHttp";
import { testNodeURL } from "./testconstants";

console.log("PUBLISHING AND RETRIEVING A CONTAINER ");

const containerHttp = new ContainerHttp(testNodeURL);

containerHttp
  .getSchemaFromContainer("mycontainer", "schema")
  .subscribe((c) => console.log("SCHEMA", c));

containerHttp
  .getContainerState("mycontainer")
  .subscribe((c) => console.log("STATE", c));

containerHttp
  .getContainerByName("mycontainer", "schema")
  .subscribe((c) => console.log("CONTAINER", c));

containerHttp
  .getAuthorizedReporters("mycontainer")
  .subscribe((c) => console.log("AUTHORIZED REPORTERS", c));
