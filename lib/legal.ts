export const LEGAL_VERSION = "2026-08-31";

export const legalOperator = {
  serviceName: "Reklaio",
  businessName: process.env.LEGAL_BUSINESS_NAME?.trim() || "Kamilunavo",
  operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "Piotr Kaminski",
  street: process.env.LEGAL_STREET?.trim() || "Otto-Braun-Straße 14",
  postalCity: process.env.LEGAL_POSTAL_CITY?.trim() || "40595 Düsseldorf",
  country: process.env.LEGAL_COUNTRY?.trim() || "Deutschland",
  email: process.env.LEGAL_EMAIL?.trim() || "reklaio@kamilunavo.com",
  phone: process.env.LEGAL_PHONE?.trim() || "+49 151 14082801",
  vatId: process.env.LEGAL_VAT_ID?.trim() || "",
  registerName: process.env.LEGAL_REGISTER_NAME?.trim() || "",
  registerNumber: process.env.LEGAL_REGISTER_NUMBER?.trim() || "",
  hostingProvider: process.env.LEGAL_HOSTING_PROVIDER?.trim() || "Hetzner Online GmbH",
  hostingCountry: process.env.LEGAL_HOSTING_COUNTRY?.trim() || "Deutschland"
};

export function legalAddressLines() {
  return [
    legalOperator.businessName,
    `Inhaber: ${legalOperator.operatorName}`,
    legalOperator.street,
    legalOperator.postalCity,
    legalOperator.country
  ];
}
