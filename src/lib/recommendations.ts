export interface RecommendationBaseProfile {
  id: string;
  college?: string | null;
  branch?: string | null;
  profile_skills: {
    skills: {
      name: string;
      category?: string | null;
    } | null;
  }[];
}

export function getProfileRelevanceScore(
  user: RecommendationBaseProfile | null,
  target: RecommendationBaseProfile
): number {
  if (!user || user.id === target.id) return 0;

  let score = 0;

  // 1. Same branch/domain matching
  if (
    user.branch &&
    target.branch &&
    user.branch.toLowerCase().trim() === target.branch.toLowerCase().trim()
  ) {
    score += 50;
  }

  // Extract skills and categories for comparison
  const userSkillNames = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.name.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  const userSkillCategories = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.category?.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  // Compare with target profile's skills
  target.profile_skills.forEach((ps) => {
    const skillName = ps.skills?.name.toLowerCase().trim();
    const skillCategory = ps.skills?.category?.toLowerCase().trim();

    if (skillName && userSkillNames.has(skillName)) {
      score += 10;
    }
    if (skillCategory && userSkillCategories.has(skillCategory)) {
      score += 20;
    }
  });

  // 2. Same college boost
  if (
    user.college &&
    target.college &&
    user.college.toLowerCase().trim() === target.college.toLowerCase().trim()
  ) {
    score += 5;
  }

  return score;
}

export interface RecommendationBaseStartup {
  id: string;
  industry: string;
  startup_roles?: {
    skills_required: string[];
  }[] | null;
}

export function getStartupRelevanceScore(
  user: RecommendationBaseProfile | null,
  startup: RecommendationBaseStartup
): number {
  if (!user) return 0;

  let score = 0;

  // Extract skills and categories for comparison
  const userSkillNames = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.name.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  const userSkillCategories = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.category?.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  // 1. Match startup roles based on required skills
  if (startup.startup_roles && startup.startup_roles.length > 0) {
    startup.startup_roles.forEach((role) => {
      role.skills_required.forEach((reqSkill) => {
        if (userSkillNames.has(reqSkill.toLowerCase().trim())) {
          score += 50; // High match if a role specifically requires a skill the user possesses
        }
      });
    });
  }

  // 2. Industry domain matching
  const industryLower = startup.industry.toLowerCase().trim();
  let matchesIndustry = false;

  userSkillCategories.forEach((cat) => {
    if (
      (cat.includes("web") &&
        (industryLower.includes("tech") ||
          industryLower.includes("software") ||
          industryLower.includes("internet"))) ||
      ((cat.includes("ai") || cat.includes("machine") || cat.includes("data")) &&
        (industryLower.includes("ai") ||
          industryLower.includes("deep tech") ||
          industryLower.includes("analytics"))) ||
      (cat.includes("design") &&
        (industryLower.includes("design") ||
          industryLower.includes("creative") ||
          industryLower.includes("media"))) ||
      (cat.includes("marketing") &&
        (industryLower.includes("marketing") ||
          industryLower.includes("adtech") ||
          industryLower.includes("sales"))) ||
      (cat.includes("business") &&
        (industryLower.includes("finance") ||
          industryLower.includes("saas") ||
          industryLower.includes("commerce")))
    ) {
      matchesIndustry = true;
    }
  });

  if (matchesIndustry) {
    score += 20;
  }

  return score;
}
