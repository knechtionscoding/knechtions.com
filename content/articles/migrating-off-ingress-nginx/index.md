---
title: "Migrating Off Of Ingress-Nginx"
description: "Choosing how to replace Ingress-Nginx"
date: "2026-02-09"
categories:
    - "Tutorial"
    - "Technical"
    - "Cloud"
    - "Kubernetes"
keywords:
    - "Kubernetes"
    - "Ingress-Nginx"
    - "HAProxy"
    - "Traefik"
---

## Introduction

On the 11th of November the maintainers of Ingress Nginx [announced](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/) the deprecation at the end of March 2026.

This is a big deal and lots of content has been written about it. I also want to say I'm fully supportive of maintainers openly and transparently deprecating software and allowing users time to migrate rather than just letting it die.

However, this presented a problem for a lot of the Kubernetes world as Ingress-Nginx has been the default ingress controller for a long time which means cluster admins both had to find replacements and migrate in about 6 months. So, what do we swap it out with?

I have the opportunity to solve this for a few different clusters. Both as part of my full time job ([Anomalo](https://www.anomalo.com/)) (where I manage multiple clusters across clouds) and my home lab clusters.

(Authors Note: These opinions are my own and do not represent the views or opinions of Anomalo)

## Evaluating Options

There has been two parallel paths that cluster admins have been taking:

1. Migrate to the [GatewayAPI](https://gateway-api.sigs.k8s.io/)
2. Stay on Ingress Class but migrate to a different controller

### Migrating to the GatewayAPI

Migrating to the GatewayAPI is an attractive decision. GatewayAPI represents the latest and greats in K8s Routing technology. Allowing a lot of customization and improving on the decisions and learning from the lessons of the past. And while you are already in there messing with the ingress controller just move to gateway-api at the same time! Easy, right?

Kind of. Migrating to the Gateway API requires changing how we think about certain things that may be a blocker for easy migration. Things like auth or certificates can cause a lot of headache.[1] This wasn't an option in just a few months and required more time than we were willing to commit.

Ultimately, we, and I, decided to go with staying on IngressClass but with an eye to the future by picking an IngressController with support for GatewayAPI.

### Swapping Ingress Controllers

If you choose to stay on IngressClass then you have a bunch of options.

For example, if your CNI supports ingresses (e.g. Cillium) then you might just be able to swap the controller! Easy.

If you already have a service mesh (e.g. Istio) you may be able to just swap to it pretty easily. 

For both situations I needed to solve I couldn't do that. Cillium didn't provide all the things needed (specifically auth or wafs easily). We didn't run Istio (though Cilium comes with Envoy so there could have been a convergence of technology).

We needed to replace with a like for like to minimize the time and pain of the upgrade.

This primarily meant evaluating "pure" ingress controllers to see what cam ethe closest to providing a multi-tenant safe, cert per hostname, auth per ingress (both api key and basic), and local waf support.

We narrowed it down to two options:

1. [ha-proxy ingress](https://haproxy-ingress.github.io/)
2. [Traefik](https://traefik.io/traefik)

They both have different positives and negatives and I'll break down why we made a different choice in different cases.

At Anomalo we needed to support:

1. Multi-Tenancy/Safety 
2. Per hostname auth and certificates
3. Local WAF Support

We tried Traefik. Traefik promises a lot of benefits. Middleware makes configuration generic. Plugins allow you to define actions or integrations in a central place.

But there are downsides. Things like WAF get locked behind support/contracts with no way to integrate your own WAF outside of writing a local plugin. The plugins that are listed: https://plugins.traefik.io/plugins/ are unavailable in reality. We couldn't (for a variety of reasons) migrate to an external WAF (like Cloudflare). 

This made Traefik a no-go for us. 

However! It was a pretty perfect fit for personal use. I was able to migrate to traefik with minimal issue in my homelab clusters. They even provided a very handy [guide](https://doc.traefik.io/traefik/migrate/nginx-to-traefik/) on what is supported and how to do it.

And to be honest in 

## Footnotes

1. There is more nuance here, for example, certificates really only matters if you can't do a wildcard certificate. But seeing as this isn't the direction I went, feel free to go read any number of other great articles on this topic
