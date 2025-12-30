import { useMemo } from "react";
import { Company } from "./useCompanies";

/**
 * Returns a Set of company names that appear in multiple venture offices
 */
export function useDuplicatedCompanyNames(companies: Company[]): Set<string> {
  return useMemo(() => {
    // Group by company name and collect unique venture offices
    const companyOfficeMap = new Map<string, Set<string>>();
    
    companies.forEach(company => {
      const name = company["Company Name"];
      const office = company.venture_office;
      if (name && office) {
        if (!companyOfficeMap.has(name)) {
          companyOfficeMap.set(name, new Set());
        }
        companyOfficeMap.get(name)!.add(office);
      }
    });
    
    // Return names that have multiple offices
    const duplicated = new Set<string>();
    companyOfficeMap.forEach((offices, name) => {
      if (offices.size > 1) {
        duplicated.add(name);
      }
    });
    
    return duplicated;
  }, [companies]);
}
