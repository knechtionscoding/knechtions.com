import React from "react";
import { Link } from "gatsby";
import { GatsbyImage } from "gatsby-plugin-image";
import { Page, Seo } from "gatsby-theme-portfolio-minimal";
import { AuthorSnippet } from "../../components/AuthorSnippet";
import { NewsletterForm } from "../../../components/NewsletterSection";
import * as classes from "./style.module.css";

function pluralize(word) {
  if (!word) return undefined;
  return word.endsWith("s") ? word : `${word}s`;
}

export default function ArticleTemplate(props) {
  const article = props.pageContext.article;
  return (
    <>
      <Seo
        title={article.title}
        description={article.description || undefined}
        useTitleTemplate={true}
      />
      <Page>
        <article className={classes.Article}>
          <div className={classes.Breadcrumb}>
            <Link
              to={props.pageContext.listingPagePath}
              title={`Back To All ${pluralize(props.pageContext.entityName) ?? "Articles"}`}
            >
              <span className={classes.BackArrow}>&#10094;</span>
              All {pluralize(props.pageContext.entityName) ?? "Articles"}
            </Link>
          </div>
          <section className={classes.Header}>
            <span className={classes.Category}>
              {article.categories.join(" / ")}
            </span>
            <h1>{article.title}</h1>
            <div className={classes.Details}>
              {article.date}
              <span className={classes.ReadingTime}>
                {article.readingTime.text}
              </span>
            </div>
          </section>
          {article.banner && article.banner.src && (
            <section className={classes.Banner}>
              <GatsbyImage
                image={article.banner.src.childImageSharp.gatsbyImageData}
                alt={article.banner.alt || `Image for ${article.title}`}
                imgClassName={classes.BannerImage}
              />
              {article.banner.caption && (
                <span
                  className={classes.BannerCaption}
                  dangerouslySetInnerHTML={{ __html: article.banner.caption }}
                />
              )}
            </section>
          )}
          <section className={classes.Body}>
            <div
              className={classes.Content}
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
            {article.keywords &&
              article.keywords.map((keyword, key) => (
                <span key={key} className={classes.Keyword}>
                  {keyword}
                </span>
              ))}
          </section>
          <section className={classes.Newsletter}>
            <h3>Enjoyed this? Subscribe for more.</h3>
            <NewsletterForm />
          </section>
          <section className={classes.Footer}>
            <AuthorSnippet />
          </section>
        </article>
      </Page>
    </>
  );
}
