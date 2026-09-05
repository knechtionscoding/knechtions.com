// GA4 measurement ID for knechtions.com. Public by nature (it ships in the
// page), so it lives here rather than in an env var -- an unset var previously
// made trackingIds `[undefined]` and failed the build.
const GA_MEASUREMENT_ID = "G-K355DYR113";

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
        // NOTE: intentionally no `googleAnalytics` option here. The theme routes
        // it through gatsby-plugin-gdpr-cookies, which would emit a *second*
        // tag alongside the gtag plugin below. Analytics is configured once, there.
      },
    },
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: [GA_MEASUREMENT_ID],
        pluginConfig: {
          head: true,        // put the tag in <head>
          respectDNT: true,  // honor Do Not Track
        },
      },
    },
  ],
};
