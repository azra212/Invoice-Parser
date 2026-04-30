import { parse } from "csv-parse/sync";
import { ExtractedData, LineItem } from "../../models/documentTypes";
import {
  cleanCell,
  emptyExtractedData,
  hasAnyLineItemValue,
  pickValue,
} from "./helpers/parserUtils";

const DESCRIPTION_HEADERS = [
  "description",
  "desc",
  "item",
  "product",
  "service",
  "name",
  "details",
];

const QUANTITY_HEADERS = ["quantity", "qty", "units", "hours"];
const UNIT_PRICE_HEADERS = ["unitPrice", "unit price", "price", "rate"];
const AMOUNT_HEADERS = ["amount", "line amount", "line total", "total"];

export class CsvParser {
  static extractData(fileBuffer: Buffer): ExtractedData {
    const document = emptyExtractedData();
    const content = fileBuffer.toString("utf-8");

    if (!content.trim()) {
      return document;
    }

    const records = parse(content, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: [",", ";", "\t"],
      relax_column_count: true,
    }) as Record<string, string>[];

    document.lineItems = records
      .map((record): LineItem => {
        const item = {
          description: cleanCell(pickValue(record, DESCRIPTION_HEADERS)),
          quantity: cleanCell(pickValue(record, QUANTITY_HEADERS)) as any,
          unitPrice: cleanCell(pickValue(record, UNIT_PRICE_HEADERS)) as any,
          amount: cleanCell(pickValue(record, AMOUNT_HEADERS)) as any,
        };

        return item;
      })
      .filter(hasAnyLineItemValue);

    return document;
  }
}
