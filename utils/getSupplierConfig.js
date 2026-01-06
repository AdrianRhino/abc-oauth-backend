import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config file
const configPath = path.join(__dirname, "../config/suppliers.json");
const suppliersConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

/**
 * Resolve environment variable placeholders in config
 */
function resolveEnvVars(obj) {
  if (typeof obj === "string" && obj.startsWith("${") && obj.endsWith("}")) {
    const envVar = obj.slice(2, -1);
    return process.env[envVar] || null;
  }
  if (typeof obj === "object" && obj !== null) {
    const resolved = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveEnvVars(value);
    }
    return resolved;
  }
  return obj;
}

/**
 * Get supplier configuration for a specific environment
 * @param {string} supplier - Supplier code (abc, srs, beacon)
 * @param {string} environment - Environment (sandbox, staging, production)
 * @returns {object} Resolved configuration object
 */
export function getSupplierConfig(supplier, environment = null) {
  const supplierConfig = suppliersConfig[supplier];
  
  if (!supplierConfig) {
    throw new Error(`Supplier "${supplier}" not found in config`);
  }

  // Use provided environment or default
  const env = environment || supplierConfig.defaultEnvironment || "sandbox";
  
  const envConfig = supplierConfig.environments[env];
  
  if (!envConfig) {
    throw new Error(
      `Environment "${env}" not found for supplier "${supplier}". ` +
      `Available: ${Object.keys(supplierConfig.environments).join(", ")}`
    );
  }

  // Resolve environment variables
  return resolveEnvVars(envConfig);
}

/**
 * Get available environments for a supplier
 */
export function getAvailableEnvironments(supplier) {
  const supplierConfig = suppliersConfig[supplier];
  if (!supplierConfig) {
    return [];
  }
  return Object.keys(supplierConfig.environments);
}

