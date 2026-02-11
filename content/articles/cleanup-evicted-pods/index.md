---
title: "Cleaning Up Evicted Pods Automatically"
description: "Ensuring Evicted pods don't hang around for ever"
date: "2026-02-11"
categories:
    - "Tutorial"
    - "Technical"
    - "Cloud"
    - "Kubernetes"
keywords:
    - "Kubernetes"
    - "Cleanup"
---

## Introduction

I recently was asked to help with a kubernetes (K8s) cluster that was seeing a lot of degraded pods. In a k8s cluster pods can be evicted for a [variety of reasons](https://kubernetes.io/docs/concepts/scheduling-eviction/#pod-disruption):
    - When limits aren't applied the pod can be evicted for using more resources than the pod has requested (ephemeral-storage, memory, cpu) AND the node running low on the resources.
    - [Pre-emption because of priority class](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)

In this case the pods were evicted because they were using ephemeral-storage without declaring it. Besides solving the underling problems in the cluster (pods being swapped to PVCs or to declare ephemeral storage usage respectively) there was a further devex experience of these pods hanging around in the cluster as objects and cluttering up GitOps tools (in this case [ArgoCD](https://argo-cd.readthedocs.io/en/stable/)). The developers wanted to be able to troubleshoot actual issues rather than a pod being kicked out for intended reasons. Leaving the evicted pods around meant that wasn't obvious what, if anything, was actually broken.

## Technical Solve

I wrote a small cronjob that cleans up evicted pods on a 30 minute basis:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: evicted-pod-cleaner
spec:
  schedule: "*/30 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 1
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: evicted-pod-cleaner
          restartPolicy: Never
          containers:
            - name: kubectl
              image: alpine/kubectl:1.34.0
              command:
                - /bin/sh
                - -c
              args:
                - |
                  set -euo pipefail
                  kubectl get pods --all-namespaces --field-selector=status.phase=Failed -o jsonpath='{range .items[?(@.status.reason=="Evicted")]}{.metadata.namespace} {.metadata.name}{"\n"}{end}' \
                  | while read namespace pod; do
                      if [ -n "$namespace" ] && [ -n "$pod" ]; then
                        echo "Deleting evicted pod ${namespace}/${pod}"
                        kubectl delete pod "$pod" -n "$namespace" --ignore-not-found
                      fi
                    done
```

This was applied via kustomize with the following RBAC:

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: evicted-pod-cleaner
rules:
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - list
      - delete
...
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: evicted-pod-cleaner
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: evicted-pod-cleaner
subjects:
  - kind: ServiceAccount
    name: evicted-pod-cleaner
    namespace: kube-system
...
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: evicted-pod-cleaner
...
```

And a kustomization.yaml:

```yaml
---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: kube-system
resources:
  - serviceaccount.yaml
  - clusterrole.yaml
  - clusterrolebinding.yaml
  - cronjob.yaml
...
```

The job frequency can obviously be adjusted to run on whatever basis you need or to exclude/include specific namespaces as needed.

Perhaps you want to exclude kube-system:

```bash
set -euo pipefail

kubectl get pods --all-namespaces \
  --field-selector=status.phase=Failed \
  -o jsonpath='{range .items[?(@.status.reason=="Evicted")]}{.metadata.namespace} {.metadata.name}{"\n"}{end}' \
| while read namespace pod; do
    if [ -n "$namespace" ] && [ -n "$pod" ] && [ "$namespace" != "kube-system" ]; then
      echo "Deleting evicted pod ${namespace}/${pod}"
      kubectl delete pod "$pod" -n "$namespace" --ignore-not-found
    fi
  done
```

Or limit it only to a prod namespace:

```bash
set -euo pipefail

kubectl get pods -n prod \
  --field-selector=status.phase=Failed \
  -o jsonpath='{range .items[?(@.status.reason=="Evicted")]}{.metadata.namespace} {.metadata.name}{"\n"}{end}' \
| while read namespace pod; do
    if [ -n "$namespace" ] && [ -n "$pod" ]; then
      echo "Deleting evicted pod ${namespace}/${pod}"
      kubectl delete pod "$pod" -n "$namespace" --ignore-not-found
    fi
  done
```

Difficult? No, but ease of use for the developers to focus on actual issues and prevent unnecessary noise in the UI or the CLI for the developers.
