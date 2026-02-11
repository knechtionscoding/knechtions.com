const fs = require("fs");
const path = require("path");

const UTM_DEFAULTS = {
  utm_source: process.env.UTM_SOURCE || "knechtions.com",
  utm_medium: process.env.UTM_MEDIUM || "article",
  utm_campaign: process.env.UTM_CAMPAIGN || "blog",
};

const INCLUDE_INTERNAL = process.env.UTM_INCLUDE_INTERNAL === "true";
const SITE_HOST = (() => {
  try {
    return new URL(process.env.SITE_URL || "https://knechtions.com").hostname;
  } catch {
    return "knechtions.com";
  }
})();

function shouldSkipHref(href) {
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("/") ||
    href.startsWith("./") ||
    href.startsWith("../") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function withUtm(href) {
  if (shouldSkipHref(href)) return href;

  let parsed;
  try {
    parsed = new URL(href);
  } catch {
    return href;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return href;
  if (!INCLUDE_INTERNAL && parsed.hostname === SITE_HOST) return href;

  Object.entries(UTM_DEFAULTS).forEach(([key, value]) => {
    if (!parsed.searchParams.has(key) && value) {
      parsed.searchParams.set(key, value);
    }
  });

  return parsed.toString();
}

function getHtmlFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(absolutePath));
      return;
    }

    if (entry.isFile() && absolutePath.endsWith(".html")) {
      files.push(absolutePath);
    }
  });

  return files;
}

function rewriteHtmlAnchors(html) {
  let modifiedCount = 0;
  const rewrittenHtml = html.replace(
    /(<a\b[^>]*\bhref\s*=\s*)(["'])([^"']+)\2/gi,
    (fullMatch, prefix, quote, href) => {
      const rewritten = withUtm(href);
      if (rewritten !== href) {
        modifiedCount += 1;
      }
      return `${prefix}${quote}${rewritten}${quote}`;
    }
  );

  return { rewrittenHtml, modifiedCount };
}

exports.onPostBuild = ({ reporter }) => {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    reporter.warn("UTM link rewrite skipped: no public directory found.");
    return;
  }

  const htmlFiles = getHtmlFiles(publicDir);
  let touchedFiles = 0;
  let modifiedLinks = 0;

  htmlFiles.forEach((filePath) => {
    const original = fs.readFileSync(filePath, "utf8");
    const { rewrittenHtml, modifiedCount } = rewriteHtmlAnchors(original);

    if (modifiedCount > 0) {
      fs.writeFileSync(filePath, rewrittenHtml, "utf8");
      touchedFiles += 1;
      modifiedLinks += modifiedCount;
    }
  });

  reporter.info(
    `UTM link rewrite complete: updated ${modifiedLinks} links in ${touchedFiles} HTML files.`
  );
};
