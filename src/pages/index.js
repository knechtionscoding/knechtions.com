import React from "react";
import {
  AboutSection,
  ArticlesSection,
  ContactSection,
  HeroSection,
  InterestsSection,
  Page,
  ProjectsSection,
  Seo,
} from "gatsby-theme-portfolio-minimal";

export default function IndexPage() {
  return (
    <>
      <Seo title="Knechtions Consulting" />
      <Page useSplashScreenAnimation>
        <HeroSection sectionId="hero" />
        <ArticlesSection sectionId="articles" heading="Latest Articles" sources={['Blog', 'Medium']} />
        <AboutSection sectionId="about" heading="About Knechtions Consulting" />
        <InterestsSection sectionId="details" heading="Details" />
        <ProjectsSection sectionId="best-practices" heading="Best Practices and Templates" />
        <ContactSection sectionId="github" heading="Issues?" />
      </Page>
    </>
  );
}
