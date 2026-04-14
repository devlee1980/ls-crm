export interface ScoreFields {
  sharedVision: number;
  valueLsCapabilities: number;
  capturesScienceValue: number;
  createGrowerDemand: number;
  agronomistInfluence: number;
  trialCapability: number;
  accessStrategicMarkets: number;
  forceMultiplier: number;
  channelControl: number;
  marginAlignment: number;
  pricingPhilosophy: number;
  supplyChainStrength: number;
  easeOfDoing: number;
  financialStability: number;
}

export interface ScoringFactor {
  key: keyof ScoreFields;
  label: string;
  category: string;
  weight: number;
  guideline: string;
}

export const SCORING_FACTORS: ScoringFactor[] = [
  // Strategic Alignment
  { key: "sharedVision",         category: "Strategic Alignment", label: "Shared future vision",        weight: 10, guideline: "1 = misaligned, 5 = fully aligned" },
  { key: "valueLsCapabilities",  category: "Strategic Alignment", label: "Value LS capabilities",       weight: 8,  guideline: "1 = low value, 5 = high value" },
  { key: "capturesScienceValue", category: "Strategic Alignment", label: "Captures science value",      weight: 7,  guideline: "1 = price only, 5 = value-based" },
  // Demand Creation
  { key: "createGrowerDemand",   category: "Demand Creation",     label: "Create grower demand",        weight: 10, guideline: "1 = weak, 5 = strong" },
  { key: "agronomistInfluence",  category: "Demand Creation",     label: "Agronomist influence",        weight: 8,  guideline: "1 = low, 5 = high" },
  { key: "trialCapability",      category: "Demand Creation",     label: "Trial capability",            weight: 5,  guideline: "1 = weak, 5 = robust" },
  // Route-to-Market
  { key: "accessStrategicMarkets", category: "Route-to-Market",  label: "Access to strategic markets", weight: 10, guideline: "1 = limited, 5 = core markets" },
  { key: "forceMultiplier",      category: "Route-to-Market",    label: "Force multiplier effect",     weight: 8,  guideline: "1 = limited, 5 = scales LS rapidly" },
  { key: "channelControl",       category: "Route-to-Market",    label: "Channel control",             weight: 5,  guideline: "1 = fragmented, 5 = centralized" },
  // Commercial
  { key: "marginAlignment",      category: "Commercial",          label: "Margin alignment",            weight: 5,  guideline: "1 = misaligned, 5 = aligned" },
  { key: "pricingPhilosophy",    category: "Commercial",          label: "Pricing philosophy",          weight: 4,  guideline: "1 = price war, 5 = value-based" },
  // Operational
  { key: "supplyChainStrength",  category: "Operational",         label: "Supply chain strength",       weight: 4,  guideline: "1 = weak, 5 = strong" },
  { key: "easeOfDoing",          category: "Operational",         label: "Ease of doing business",      weight: 3,  guideline: "1 = complex, 5 = easy" },
  // Financial
  { key: "financialStability",   category: "Financial",           label: "Financial stability",         weight: 8,  guideline: "1 = uncertain, 5 = rock solid" },
];

export const MAX_SCORE = SCORING_FACTORS.reduce((sum, f) => sum + f.weight * 5, 0); // 485

export function computeWeightedScore(fields: ScoreFields): number {
  return SCORING_FACTORS.reduce((sum, f) => sum + (fields[f.key] ?? 0) * f.weight, 0);
}

export function scoreTier(weightedScore: number): "Tier 1" | "Tier 2" | "Tier 3" {
  if (weightedScore >= 350) return "Tier 1";
  if (weightedScore >= 200) return "Tier 2";
  return "Tier 3";
}

export const EMPTY_SCORE_FIELDS: ScoreFields = {
  sharedVision: 0,
  valueLsCapabilities: 0,
  capturesScienceValue: 0,
  createGrowerDemand: 0,
  agronomistInfluence: 0,
  trialCapability: 0,
  accessStrategicMarkets: 0,
  forceMultiplier: 0,
  channelControl: 0,
  marginAlignment: 0,
  pricingPhilosophy: 0,
  supplyChainStrength: 0,
  easeOfDoing: 0,
  financialStability: 0,
};
