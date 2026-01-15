module.exports = {
  plugins: [
    {
      resolve: "gatsby-theme-portfolio-minimal",
      options: {
        siteUrl: "https://knechtions.com/", // Used for sitemap generation
        manifestSettings: {
          favicon: "content/images/favicon.png", // Path is relative to the root
          siteName: "Knechtions Consulting", // Used in manifest.json
          shortName: "Knechtions", // Used in manifest.json
          startUrl: "/", // Used in manifest.json
          backgroundColor: "#FFFFFF", // Used in manifest.json
          themeColor: "#000000", // Used in manifest.json
          display: "minimal-ui", // Used in manifest.json
        },
        contentDirectory: "./content",
        blogSettings: {
          path: "/blog", // Defines the slug for the blog listing page
          usePathPrefixForArticles: false, // Default true (i.e. path will be /blog/first-article)
        },
        googleAnalytics: {
          // If set, the Google Analytics integration is enabled
          trackingId: 'G-Y1VJSLGR2S', // e.g. UA-XXXXXX-X
          anonymize: true, // Default is true
          environments: ['production'], // Default ["production"]
        },
      },
    },
  ],
};
