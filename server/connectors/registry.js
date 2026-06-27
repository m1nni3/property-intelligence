import { HttpConnector } from "./http-connector.js";
import { BrowserConnector } from "./browser-connector.js";

const CONNECTOR_MAP = {
  http: HttpConnector,
  browser: BrowserConnector,
  custom: null,
  file: null,
};

export function getConnector(source) {
  const ConnectorClass = CONNECTOR_MAP[source.connector_type];
  if (!ConnectorClass) {
    throw new Error(`No connector registered for type: ${source.connector_type}`);
  }
  return new ConnectorClass(source);
}

export const CONNECTOR_TYPES = Object.keys(CONNECTOR_MAP).filter((k) => CONNECTOR_MAP[k]);
