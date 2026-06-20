"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Play, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface ProjectCardProps {
  title: string;
  description?: string | null;
  techStack?: string[];
  coverImageUrl?: string | null;
  projectImages?: string[] | null;
  videoUrl?: string | null;
  demoUrl?: string | null;
  githubUrl?: string | null;
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function ProjectCard({
  title,
  description,
  techStack = [],
  coverImageUrl,
  projectImages,
  videoUrl,
  demoUrl,
  githubUrl,
}: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!showImageModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowImageModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImageModal]);

  const shouldTruncate = description && description.length > 150;

  // Gather cover image and other gallery screenshots
  const allImages = [coverImageUrl, ...(projectImages ?? [])].filter(
    (url): url is string => Boolean(url)
  );

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  return (
    <>
      <div className="flex flex-col bg-surface rounded-lg overflow-hidden shadow-card border border-border/40 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
        {/* Cover Image Container */}
        <div 
          onClick={() => allImages.length > 0 && setShowImageModal(true)}
          className={`relative h-48 w-full bg-accent-green/5 border-b border-border/40 group/cover overflow-hidden ${allImages.length > 0 ? "cursor-zoom-in" : ""}`}
        >
          {/* Video Play Badge overlay */}
          {videoUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowVideoModal(true);
              }}
              className="absolute top-3 right-3 flex items-center gap-1 bg-ink/80 backdrop-blur-sm hover:bg-accent-green hover:text-white text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all z-10"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Demo Video</span>
            </button>
          )}

          {allImages.length > 0 ? (
            <div className="relative w-full h-full overflow-hidden">
              {/* Soft blurred background layer to prevent raw side-bars */}
              <Image
                src={allImages[currentImageIndex]}
                alt=""
                fill
                className="object-cover blur-lg opacity-25 scale-[1.08] pointer-events-none"
                unoptimized
              />
              {/* Centered contained front layer showing full screenshot */}
              <Image
                src={allImages[currentImageIndex]}
                alt={`Image for ${title}`}
                fill
                className="object-contain p-2.5 transition-transform duration-300 group-hover/cover:scale-[1.02]"
                unoptimized
              />

              {/* Carousel Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-ink/65 hover:bg-ink/85 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity z-10 shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-ink/65 hover:bg-ink/85 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity z-10 shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "bg-white w-3"
                            : "bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-sunken text-muted font-heading font-bold text-sm">
              No Cover Image
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-6 gap-3">
          <div>
            <h4 className="font-heading text-lg font-bold text-ink line-clamp-1">
              {title}
            </h4>
            {description && (
              <div className="mt-1.5 text-sm text-muted leading-relaxed">
                <span className="whitespace-pre-line">
                  {shouldTruncate && !isExpanded
                    ? `${description.slice(0, 150)}...`
                    : description}
                </span>
                {shouldTruncate && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1.5 inline-block text-xs font-semibold text-accent-green hover:underline focus:outline-none"
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            )}
          </div>

          {techStack.length > 0 && (() => {
            const items = Array.from(new Set(
              techStack
                .flatMap(item => item.split(/[,\/;]+/))
                .map(item => item.trim())
                .filter(item => item.length > 0 && item.toLowerCase() !== "null")
            ));
            
            if (items.length === 0) return null;
            
            return (
              <div className="mt-3 border-t border-border/20 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green block mb-1.5">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="bg-surface-sunken text-muted px-2.5 py-1 rounded-full text-[11px] font-medium border border-border/10"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Links */}
          {(demoUrl || githubUrl) && (
            <div className="flex gap-4 mt-auto pt-4 border-t border-border/40">
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent-green transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Live Demo</span>
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent-green transition-colors"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal Player Overlay */}
      {showVideoModal && videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video element */}
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal Overlay */}
      {showImageModal && allImages.length > 0 && (
        <div 
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out select-none"
        >
          {/* Header controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="text-white/60 text-xs font-semibold bg-black/45 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {currentImageIndex + 1} / {allImages.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Container */}
          <div 
            className="relative flex items-center justify-center w-full max-w-5xl h-[80vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[currentImageIndex]}
              alt={title}
              width={1600}
              height={1200}
              className="max-h-[80vh] max-w-[90vw] md:max-w-[80vw] object-contain rounded-lg select-none cursor-default"
              unoptimized
            />

            {/* Carousel Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-2 md:left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 md:right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface CategorizedTech {
  category: string;
  items: string[];
}

export function parseAndCategorizeTechStack(techStack: string[]): CategorizedTech[] {
  const text = techStack.join(" ").toLowerCase();
  
  // Define technology lists and their display names
  const mapping: { category: string; keywords: { name: string; aliases: string[] }[] }[] = [
    {
      category: "Frontend",
      keywords: [
        { name: "React", aliases: ["react", "react.js", "reactjs"] },
        { name: "Next.js", aliases: ["next.js", "nextjs"] },
        { name: "Vue", aliases: ["vue", "vue.js", "vuejs"] },
        { name: "Angular", aliases: ["angular", "angularjs"] },
        { name: "Svelte", aliases: ["svelte", "sveltekit"] },
        { name: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"] },
        { name: "Bootstrap", aliases: ["bootstrap"] },
        { name: "HTML", aliases: ["html", "html5"] },
        { name: "CSS", aliases: ["css", "css3"] },
        { name: "JavaScript", aliases: ["javascript", "js"] },
        { name: "TypeScript", aliases: ["typescript", "ts"] },
        { name: "Vite", aliases: ["vite", "vitejs"] },
        { name: "Webpack", aliases: ["webpack"] },
        { name: "SolidJS", aliases: ["solidjs", "solid.js"] },
        { name: "jQuery", aliases: ["jquery"] },
        { name: "Sass", aliases: ["sass", "scss"] },
        { name: "Redux", aliases: ["redux", "redux-toolkit"] },
      ]
    },
    {
      category: "Backend",
      keywords: [
        { name: "Node.js", aliases: ["node.js", "nodejs", "node"] },
        { name: "Express", aliases: ["express", "expressjs", "express.js"] },
        { name: "NestJS", aliases: ["nestjs", "nest.js"] },
        { name: "Django", aliases: ["django"] },
        { name: "Flask", aliases: ["flask"] },
        { name: "FastAPI", aliases: ["fastapi"] },
        { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring"] },
        { name: "Laravel", aliases: ["laravel"] },
        { name: "Ruby on Rails", aliases: ["ruby on rails", "rails", "ror"] },
        { name: "PHP", aliases: ["php"] },
        { name: "Go", aliases: ["go", "golang"] },
        { name: "Rust", aliases: ["rust", "rustlang"] },
        { name: "Java", aliases: ["java"] },
        { name: "C#", aliases: ["c#", "csharp", ".net", "dotnet"] },
        { name: "GraphQL", aliases: ["graphql"] },
      ]
    },
    {
      category: "Database & Backend Services",
      keywords: [
        { name: "PostgreSQL", aliases: ["postgres", "postgresql"] },
        { name: "MySQL", aliases: ["mysql"] },
        { name: "MongoDB", aliases: ["mongodb", "mongo"] },
        { name: "Redis", aliases: ["redis"] },
        { name: "SQLite", aliases: ["sqlite", "sqlite3"] },
        { name: "Supabase", aliases: ["supabase"] },
        { name: "Firebase", aliases: ["firebase"] },
        { name: "Prisma", aliases: ["prisma"] },
        { name: "DynamoDB", aliases: ["dynamodb"] },
        { name: "Cassandra", aliases: ["cassandra"] },
        { name: "MariaDB", aliases: ["mariadb"] },
        { name: "Oracle", aliases: ["oracle"] },
      ]
    },
    {
      category: "Mobile",
      keywords: [
        { name: "Flutter", aliases: ["flutter"] },
        { name: "React Native", aliases: ["react native", "reactnative"] },
        { name: "Kotlin", aliases: ["kotlin"] },
        { name: "Swift", aliases: ["swift"] },
        { name: "Android", aliases: ["android"] },
        { name: "iOS", aliases: ["ios"] },
        { name: "Expo", aliases: ["expo"] },
      ]
    },
    {
      category: "DevOps, Tools & Infrastructure",
      keywords: [
        { name: "Docker", aliases: ["docker"] },
        { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
        { name: "AWS", aliases: ["aws", "amazon web services"] },
        { name: "Google Cloud", aliases: ["gcp", "google cloud", "google cloud platform"] },
        { name: "Azure", aliases: ["azure"] },
        { name: "Git", aliases: ["git"] },
        { name: "GitHub", aliases: ["github"] },
        { name: "Vercel", aliases: ["vercel"] },
        { name: "Netlify", aliases: ["netlify"] },
        { name: "Heroku", aliases: ["heroku"] },
        { name: "CI/CD", aliases: ["ci/cd", "cicd", "github actions"] },
        { name: "Nginx", aliases: ["nginx"] },
        { name: "Linux", aliases: ["linux"] },
      ]
    }
  ];

  const categoriesMap: Record<string, Set<string>> = {};
  const identifiedTechs = new Set<string>();

  // Initialize categories
  mapping.forEach(m => {
    categoriesMap[m.category] = new Set<string>();
  });

  // Helper to extract matches based on aliases with word boundary checks or substring check for multi-word
  mapping.forEach(group => {
    group.keywords.forEach(tech => {
      for (const alias of tech.aliases) {
        const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const boundaryStart = /^[a-zA-Z0-9]/.test(alias) ? '\\b' : '';
        const boundaryEnd = /[a-zA-Z0-9]$/.test(alias) ? '\\b' : '';
        const regex = new RegExp(boundaryStart + escaped + boundaryEnd, 'i');
        
        if (regex.test(text)) {
          categoriesMap[group.category].add(tech.name);
          identifiedTechs.add(tech.name.toLowerCase());
          break; // Found a match for this tech, no need to check other aliases
        }
      }
    });
  });

  // Extract unrecognized non-noise items separated by punctuation/dividers
  const noiseWords = new Set(["using", "built", "with", "the", "and", "for", "used", "database", "authentication", "frontend", "backend", "project", "app", "application", "website", "stack"]);
  const splitItems = techStack
    .flatMap(item => item.split(/[,\/;]+/))
    .map(item => item.trim())
    .filter(Boolean);

  splitItems.forEach(item => {
    const itemLower = item.toLowerCase();
    let alreadyIdentified = false;
    identifiedTechs.forEach(tech => {
      if (itemLower.includes(tech) || tech.includes(itemLower)) {
        alreadyIdentified = true;
      }
    });

    if (!alreadyIdentified && !noiseWords.has(itemLower) && item.length < 30 && item.length > 1) {
      const fallbackCat = "Other / Specialty";
      if (!categoriesMap[fallbackCat]) {
        categoriesMap[fallbackCat] = new Set<string>();
      }
      categoriesMap[fallbackCat].add(item);
    }
  });

  // Convert map to array of CategorizedTech
  return Object.entries(categoriesMap)
    .map(([category, itemsSet]) => ({
      category,
      items: Array.from(itemsSet)
    }))
    .filter(c => c.items.length > 0);
}
