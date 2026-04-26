import React from "react";
import * as classes from "./style.module.css";

export function NewsletterSection({ sectionId, heading }) {
  return (
    <section id={sectionId} className={classes.Section}>
      <div className={classes.ContentWrapper}>
        {heading && <h3 className={classes.Heading}>{heading}</h3>}
        <form
          action="https://buttondown.com/api/emails/embed-subscribe/knechtions"
          method="post"
          className={classes.Form}
        >
          <label htmlFor="bd-email" className={classes.Label}>
            Enter your email
          </label>
          <div className={classes.InputRow}>
            <input
              type="email"
              name="email"
              id="bd-email"
              placeholder="you@example.com"
              className={classes.Input}
              required
            />
            <button type="submit" className={classes.Button}>
              Subscribe
            </button>
          </div>
          <p className={classes.PoweredBy}>
            <a
              href="https://buttondown.com/refer/knechtions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by Buttondown.
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
