export function splitLongTechTags(techStack: string[]): string[] {
  const result: string[] = [];
  const knownTechs = [
    "react native", "react", "next.js", "nextjs", "vue", "angular", "svelte", 
    "tailwind css", "tailwind", "bootstrap", "html", "css", "javascript", "js", 
    "typescript", "ts", "vite", "webpack", "jquery", "sass", "scss", "redux",
    "node.js", "nodejs", "node", "express", "nestjs", "django", "flask", 
    "fastapi", "spring boot", "springboot", "spring", "laravel", "ruby on rails", 
    "rails", "php", "go", "golang", "rust", "java", "c#", "csharp", "graphql",
    "postgresql", "postgres", "mysql", "mongodb", "mongo", "redis", "sqlite", 
    "supabase", "firebase", "prisma", "dynamodb", "flutter", "dart", "riverpod",
    "kotlin", "swift", "android", "ios", "expo", "docker", "kubernetes", "aws", 
    "google cloud", "gcp", "azure", "git", "github", "vercel", "netlify", 
    "heroku", "nginx", "linux", "webrtc", "arduino", "c++", "zod", "nativewind",
    "prompt engineering", "heygen", "d-id", "razorpay", "twilio", "frontend", "backend",
    "artificial intelligence", "database", "authentication", "devops", "cloud",
    "real-time communication", "other technologies", "state management",
    "performance monitoring", "video processing", "rest apis"
  ];

  techStack.forEach(item => {
    if (!item) return;
    
    // Convert to string to avoid type errors
    const itemStr = String(item).trim();
    if (itemStr.length <= 25) {
      result.push(itemStr);
      return;
    }

    const itemLower = itemStr.toLowerCase();
    const matched = new Set<string>();
    const sortedTechs = [...knownTechs].sort((a, b) => b.length - a.length);

    let remainingText = itemLower;
    sortedTechs.forEach(tech => {
      if (remainingText.includes(tech)) {
        let displayName = tech;
        if (tech === "react") displayName = "React";
        else if (tech === "react native") displayName = "React Native";
        else if (tech === "next.js" || tech === "nextjs") displayName = "Next.js";
        else if (tech === "tailwind css" || tech === "tailwind") displayName = "Tailwind CSS";
        else if (tech === "node.js" || tech === "nodejs" || tech === "node") displayName = "Node.js";
        else if (tech === "express") displayName = "Express";
        else if (tech === "typescript" || tech === "ts") displayName = "TypeScript";
        else if (tech === "javascript" || tech === "js") displayName = "JavaScript";
        else if (tech === "supabase") displayName = "Supabase";
        else if (tech === "firebase") displayName = "Firebase";
        else if (tech === "postgresql" || tech === "postgres") displayName = "PostgreSQL";
        else if (tech === "mysql") displayName = "MySQL";
        else if (tech === "mongodb") displayName = "MongoDB";
        else if (tech === "redis") displayName = "Redis";
        else if (tech === "sqlite") displayName = "SQLite";
        else if (tech === "flutter") displayName = "Flutter";
        else if (tech === "dart") displayName = "Dart";
        else if (tech === "riverpod") displayName = "Riverpod";
        else if (tech === "docker") displayName = "Docker";
        else if (tech === "kubernetes") displayName = "Kubernetes";
        else if (tech === "aws") displayName = "AWS";
        else if (tech === "google cloud" || tech === "gcp") displayName = "Google Cloud";
        else if (tech === "webrtc") displayName = "WebRTC";
        else if (tech === "zod") displayName = "Zod";
        else if (tech === "nativewind") displayName = "NativeWind";
        else if (tech === "expo") displayName = "Expo";
        else if (tech === "prompt engineering") displayName = "Prompt Engineering";
        else {
          displayName = tech.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        matched.add(displayName);
        remainingText = remainingText.replace(tech, "");
      }
    });

    if (matched.size > 0) {
      matched.forEach(t => result.push(t));
    } else {
      const fallbacks = itemStr
        .split(/[,\s\/;|\n\t]+/)
        .map(t => t.trim())
        .filter(t => t.length > 1);
      fallbacks.forEach(t => result.push(t));
    }
  });

  return result;
}
