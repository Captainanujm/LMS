// Business Rule Engine - checks if borrower is eligible

interface PersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: string;
}

interface BREResult {
  passed: boolean;
  errors: string[];
}

// calculate age from date of birth
function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function runBRE(details: PersonalDetails): BREResult {
  const errors: string[] = [];

  // Rule 1: Age must be between 23 and 50
  const age = getAge(new Date(details.dateOfBirth));
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Rule 2: Salary must be at least 25000
  if (details.monthlySalary < 25000) {
    errors.push(`Monthly salary must be at least ₹25,000. Your salary: ₹${details.monthlySalary.toLocaleString()}`);
  }

  // Rule 3: PAN must be valid format (e.g., ABCDE1234F)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(details.pan)) {
    errors.push("PAN is not in valid format. Expected format: ABCDE1234F");
  }

  // Rule 4: Cannot be unemployed
  if (details.employmentMode === "unemployed") {
    errors.push("Unemployed applicants are not eligible for a loan");
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}
