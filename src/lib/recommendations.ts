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

export interface RecommendationBaseProject {
  id: string;
  owner_id: string;
  tech_stack: string[];
  owner?: {
    branch: string | null;
    college: string | null;
  } | null;
}

export function getProjectRelevanceScore(
  user: RecommendationBaseProfile | null,
  project: RecommendationBaseProject
): number {
  if (!user || user.id === project.owner_id) return 0;

  let score = 0;

  // 1. Same branch/domain matching of owner
  if (
    user.branch &&
    project.owner?.branch &&
    user.branch.toLowerCase().trim() === project.owner.branch.toLowerCase().trim()
  ) {
    score += 50;
  }

  // 2. Tech stack overlaps with user skills
  const userSkillNames = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.name.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  if (project.tech_stack && project.tech_stack.length > 0) {
    project.tech_stack.forEach((tech) => {
      if (userSkillNames.has(tech.toLowerCase().trim())) {
        score += 10;
      }
    });
  }

  // 3. Same college boost
  if (
    user.college &&
    project.owner?.college &&
    user.college.toLowerCase().trim() === project.owner.college.toLowerCase().trim()
  ) {
    score += 5;
  }

  return score;
}

export interface RecommendationBaseCommunity {
  id: string;
  name: string;
  description: string | null;
}

export function getCommunityRelevanceScore(
  user: RecommendationBaseProfile | null,
  community: RecommendationBaseCommunity
): number {
  if (!user) return 0;

  let score = 0;

  const userSkillNames = new Set(
    user.profile_skills
      .map((ps) => ps.skills?.name.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

  const textToSearch = [
    community.name,
    community.description ?? ""
  ].join(" ").toLowerCase();

  // 1. Keyword check for branch / college
  if (user.branch && textToSearch.includes(user.branch.toLowerCase().trim())) {
    score += 50;
  }

  if (user.college && textToSearch.includes(user.college.toLowerCase().trim())) {
    score += 30;
  }

  // 2. Keyword check for skills
  userSkillNames.forEach((skill) => {
    if (textToSearch.includes(skill)) {
      score += 10;
    }
  });

  return score;
}

