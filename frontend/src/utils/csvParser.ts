
import Papa from "papaparse";

/* =========================================
   TYPES
========================================= */

export interface CSVParseResult {
  validEmails: string[];
  invalidEmails: string[];
  duplicateEmails: string[];
  totalFound: number;
  totalValid: number;
  totalInvalid: number;
  totalDuplicates: number;
}

export interface CSVParserOptions {
  removeDuplicates?: boolean;
  lowercase?: boolean;
}


/* =========================================
   EMAIL VALIDATION
========================================= */

export const isValidEmail = (email: string): boolean => {
  const normalizedEmail = email.trim();

  // Basic email format validation.
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(normalizedEmail)) {
    return false;
  }

  // Reject consecutive dots.
  if (normalizedEmail.includes("..")) {
    return false;
  }

  // Check maximum length.
  if (normalizedEmail.length > 254) {
    return false;
  }

  const [localPart, domain] = normalizedEmail.split("@");

  // Local part maximum length.
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Domain maximum length.
  if (!domain || domain.length > 253) {
    return false;
  }

  return true;
};


/* =========================================
   NORMALIZE EMAIL
========================================= */

export const normalizeEmail = (
  email: string,
  lowercase = true
): string => {
  const cleanedEmail = email.trim();

  return lowercase
    ? cleanedEmail.toLowerCase()
    : cleanedEmail;
};


/* =========================================
   EXTRACT EMAIL ADDRESSES
========================================= */

export const extractEmails = (
  text: string
): string[] => {

  const emailRegex =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+/g;

  return text.match(emailRegex) || [];
};


/* =========================================
   PARSE CSV FILE
========================================= */

export const parseCSVFile = async (
  file: File
): Promise<string[][]> => {

  return new Promise((resolve, reject) => {

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,

      complete: (results) => {

        if (results.errors.length > 0) {
          reject(
            new Error(
              results.errors[0].message ||
              "Unable to parse CSV file."
            )
          );

          return;
        }

        resolve(results.data);
      },

      error: (error) => {
        reject(
          new Error(
            error.message || "CSV parsing failed."
          )
        );
      },
    });

  });
};


/* =========================================
   PARSE TXT FILE
========================================= */

export const parseTXTFile = async (
  file: File
): Promise<string[][]> => {

  const content = await file.text();

  return content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => [line.trim()]);
};


/* =========================================
   VALIDATE AND PROCESS EMAILS
========================================= */

export const processEmails = (
  rawEmails: string[],
  options: CSVParserOptions = {}
): CSVParseResult => {

  const {
    removeDuplicates = true,
    lowercase = true,
  } = options;

  const validEmails: string[] = [];
  const invalidEmails: string[] = [];
  const duplicateEmails: string[] = [];

  const seenEmails = new Set<string>();

  for (const rawEmail of rawEmails) {

    const email = normalizeEmail(rawEmail, lowercase);

    if (!email) {
      continue;
    }

    if (!isValidEmail(email)) {
      invalidEmails.push(email);
      continue;
    }

    const comparisonKey = email.toLowerCase();

    if (
      removeDuplicates &&
      seenEmails.has(comparisonKey)
    ) {
      duplicateEmails.push(email);
      continue;
    }

    seenEmails.add(comparisonKey);
    validEmails.push(email);
  }

  return {
    validEmails,
    invalidEmails,
    duplicateEmails,

    totalFound: rawEmails.length,

    totalValid: validEmails.length,

    totalInvalid: invalidEmails.length,

    totalDuplicates: duplicateEmails.length,
  };
};


/* =========================================
   MAIN FILE PARSER
========================================= */

export const parseEmailFile = async (
  file: File,
  options: CSVParserOptions = {}
): Promise<CSVParseResult> => {

  if (!file) {
    throw new Error("Please select a file.");
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  let rows: string[][] = [];

  // Parse CSV.
  if (extension === "csv") {

    rows = await parseCSVFile(file);

  }

  // Parse TXT.
  else if (extension === "txt") {

    rows = await parseTXTFile(file);

  }

  // Unsupported format.
  else {

    throw new Error(
      "Unsupported file format. Please upload CSV or TXT."
    );
  }

  // Extract email addresses from every cell.
  const rawEmails: string[] = [];

  for (const row of rows) {

    for (const cell of row) {

      const extracted = extractEmails(cell);

      rawEmails.push(...extracted);
    }
  }

  if (rawEmails.length === 0) {
    throw new Error(
      "No email addresses were found in the uploaded file."
    );
  }

  return processEmails(rawEmails, options);
};


/* =========================================
   VALIDATE FILE
========================================= */

export const validateEmailFile = (
  file: File,
  maxSizeMB = 5
): void => {

  if (!file) {
    throw new Error("Please select a file.");
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (!["csv", "txt"].includes(extension || "")) {
    throw new Error(
      "Only CSV and TXT files are supported."
    );
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size === 0) {
    throw new Error("The uploaded file is empty.");
  }

  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size must not exceed ${maxSizeMB} MB.`
    );
  }
};
