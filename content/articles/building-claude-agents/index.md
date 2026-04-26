---
title: "Building an Internal Agentic Platform"
description: "How we built Claude Agents, but for our own company"
date: "2026-04-26"
categories:
    - "Tutorial"
    - "Technical"
    - "Cloud"
    - "Kubernetes"
    - "AI"
keywords:
    - "Kubernetes"
    - "LLMs"
    - "AI"
    - "Cloud"
    - "Claude"
---

## Introduction

About four months ago, a coworker and I were talking about the need for background agents. As LLMs and coding agents become ever increasingly competent (though we don't yet know where they plateau), it felt increasingly like we needed a platform to run those agents on that was internal to [Anomalo](https://www.anomalo.com/). Following our Company Onsite in February, we saw an ever increasing amount of PRs (up 150% from the preceeding 60 day period). We have seen the usage of PRs where the agent wrote most or all of the code increase 600% and where agents wrote between 1-50% of the code go up 1000%. We also saw an explosion of PRs. Previously we shipped about 150 PRs a week, which was a lot for an engineering team of about 20 people, and now we were shipping 350. Side note: There are a ton of organizational and operational challenges that have come from this that I will cover in a future article. About two weeks later, another co-worker shared [Background Agents](https://background-agents.com/), which accurately summarized both the problems we were experiencing and gave us some insight into what we needed to build.

---

## The Problem

We needed to solve a variety of bottlenecks in the development and delivery process. While solving the organizational and operational challenges, we also needed to build a method for these agents to act without someone's local machine running. We also wanted to give the agents the best chance of succeeding. That meant that the following had to be true:

1. We needed usage to be seamless. Claude isn't just the most used coding tool because of the model. Rather the Desktop App, the slack app, Claude Code on the Web, and integrations into many other places meant that using Claude is incredibly easy. Whatever we had needed to be as easy.
2. We needed to give it our own context and tools. Claude Code and the Claude app are awesome but they lack a harness, they lack pre-installed tooling, and they can lack access to other resources that may be helpful (like observability, ticketing, or internal knowledgebases).
3. We needed to run it on our infrastructure. In order to connect it to our own internal resources, we needed it hosted on our own infrastructure, with a strong preference for Kubernetes based tooling.
4. We didn't have a budget. Anomalo is a small start up. I don't have the budget to ask for 50k to run an Agentic Platform.

---

## Tooling

So we set out to evaluate the landscape. We found a variety of tools. And most of them either were local only, required paying for self hosting, or didn't actually solve background agents because they were trying to replace the desktop app part of Claude. We managed to find two purpose built tools:

1. [Kagent](https://kagent.dev/)
2. [Kelos](https://github.com/kelos-dev/kelos)

Both of these allowed us to run our agents from a variety of places, provide the required context, and self host the infrastructure.

KAgent is the more popular tool, we gave it a shot first, and it is very powerful. Except it was purpose built for running agents against k8s. Which meant out of the box it had lots of cool tools for Platform Engineers, but doesn't really work for our more general use case.

We wanted anyone at Anomalo to interact with our platform from Slack, Linear, Github, or on a cron basis (eventually web)-- be able to kick off an agent to solve a task for them. This could be something simple as a PR review agent (simple in scope, not in implementation), or something like a product questions bot that automatically answered questions about the product to Sales and other engineers, to something really complex like providing customized digests to employees about what they cared about. Kagent didn't fulfill our goals there. We pivoted rather quickly to Kelos.

Kelos was interesting because it gave us the primitives to separate both tasks, agentconfigs, and workspaces, was opensource, was accepting of new contributions very quickly, and interestingly, used itself for self-development. Under the hood Kelos uses Kubernetes jobs and cronjobs to run the tasks, which means we got to use our existing observability stack and our GitOps stack. Because it allows for referencing workspaces we can provide the git repo and configuration for agents easily. We can share the underlying agent config to make generic and specific agents. And the prompt interpolation and templating makes it really convenient for engineers and non-engineers to interact with. We got it installed and running very quickly and then started work on improving the rough edges of a bleeding edge piece in infrastructure.

---

## Implementation

Kelos was originally built specifically for Github PRs and built on a polling method. It worked fine for smaller projects, but we needed webhook support. So we got to work. We forked the repo, added webhook support, and got it merged to upstream. We also needed support for other webhooks sources besides Github. So we added Linear and generic webhooks. We needed support for Slack (that contribution is currently pending final review upstream, but is functional in our fork). Once Github, Linear, Generic Webhooks, and Slack were ready (took about three weeks from start to finish), we let the rest of the company start using Gravity (our internal name for it). It took off rather quickly.

The first agents we added replaced existing workflows:

1. Dependency Review Agent. We use [Renovate Bot](https://docs.renovatebot.com/) for most of our dependency upgrades and keeping on top of those was a large task in a codebase as complex as ours. We added a task that triggered on renovate PRs and looked through the change logs for breaking changes, looked if our codebase utilized those, and either approved or assigned it to a human to review.
2. Migration Merge Agent. Managing our Django Migrations and making sure you didn't have conflicts with main was very annoying. We had already written a skill that allowed Claude to look for a merge conflict and then properly resolve it for migrations (in this case it mostly means increasing the numerical counter from 100 to 101 because someone else already merged 100). The Migration Merge Agent runs on PRs and when we merged to main with specific files triggered and will check for merge conflicts with the migrations file and then resolve them.
3. A PR Approval Bot. One of our biggest blockers was PR Approvals. This has been true at basically every company I have worked at and was no different at Anomalo. Getting an approval was an exercise in chasing and reminding people and it had the effect that PRs either sat for a while, PRs were a deep dive or a rubber stamp, and that it was a chore. There was a better way. First, we added [Greptile](https://www.greptile.com/) to give us higher quality reviews (this will also be a separate blog post). We trialed three different PR Review agents, with Greptile as the clear favorite amongst engineers, and so we added that. But then we still needed a human involved. So we added a bot that would evaluate the PR Risk on a scale of Very-Low to High and approve Very Low and Low PRs automatically. We gave it specific criteria to evaluate against, spent two weeks comparing it to human evaluation of the risk of the PR, and then opened it up. It approves about 50% of our PRs right now.
4. Product Questions Agent. We have a few Slack channels that people can ask questions about Anomalo, either about new features, capabilities, deployment questions, etc. We added an agent that takes a first pass at those, uses Notion, Linear, the codebase, and then answers questions. Questions were answered much faster.

Then we opened it up to whole company to start writing agents. They have written some incredibly interesting ones. We had an security analyst write one that reports on our compliance status, trends, and what we need to solve. Someone else wrote one that analyzed incoming customer questions and posted private proposed resolutions. We had someone write a salesforce digest agent that summarized to all the sales engineers what opportunities need attention, proposed actions, etc.

Right around this time Anthropic announced [Managed Agents](https://www.anthropic.com/engineering/managed-agents). So they clearly had the same goals and problems to solve as we did.

Since launching it our internal platform has reviewed more than 1700 PRs, runs more than 200 jobs (answering slack questions, upgrading dependencies, writing code) a day, has had more than 100 PRs merged, has more than 400 mentions in public Slack channels (it also responds to DMs, but we can't measure that), and many more cool stats.

We have since added inference profiles as we run on bedrock, are working on a CLI and UI so that people can play with Claude code locally and then kick off agents during their [night shift](https://jamon.dev/night-shift), and improving Kelos itself.

## Learnings

1. We very quickly got adoption. People wanted to use it ASAP.
2. Meeting people where they were was important. Slack is by far our most used interaction point. I have two very talented coworkers (Jasmine and Kristian) who put a lot of work into making Slack a really cool user experience. The agent will provide back streaming updates on what it is doing, how it is doing it, and then ask questions when needed. This has driven usage significantly
3. Being able to run it on our own infra has expanded the tools and capabilities we can give it access too. It extremely carefully vetted read access to our observability tools, knoweldge base, security scanning tools, Slack, and cloud environments. This greatly increases the efficacy of the tooling.
4. Optimizing for cold start time isn't worth it yet. We run the agents inside our own Dev Container images which are rather large as they contain our full dev dependencies and tooling. They are around 4Gb in size. However, that's okay because generally we have already pulled that image onto the node in question and we spent a lot of time optimizing the [image pull times](https://knechtions.com/improving-container-image-pull/)
5. We've had to get a lot better at writing guardrails for our codebase. Things that could be communicated via word of mouth or shared Knowledge Transfer now needs to be added as linter config, CI configuration, or some other enforceable rule.
6. The compute needed for this is surprisingly small. Most of the cost is in tokens.
7. With most of the cost in tokens providing guardrails and declarative and idiomatic methods for the agent to do things is important. You shouldn't just ask it to search Slack. Give it a script it can run. Give it your package manager/tooling of choice available so it doesn't waste tokens reinventing the wheel. Install [pre-commit hooks](https://github.com/j178/prek) into the environment so that it cannot push poorly formated code or secrets.
8. Telemetry remains important. Seeing how people are using our internal platform is incredibly important so we can solve problems people are running into.
9. We can self-evaluate with the agents. The final line of the prompt in the slack responder agents is to tell us what would have made Gravity's job easier. We have another agent that daily aggregates that feedback and puts it into Linear tickets for us to work on.
10. Agents aren't solving all of our problems. Rather it is forcing us to solve problems we would hit at scale earlier in the process. Both operationally and organizationally. But again, another post for another time.
