import { getRouteByPath } from "../routes.js";

export function getDashboardMetrics(fixtures) {
  return {
    publishedArticles: (fixtures.articles || []).filter((article) => article.status === "published").length,
    drafts: (fixtures.articles || []).filter((article) => article.status === "draft").length,
    pendingComments: (fixtures.comments || []).filter((comment) => comment.status === "pending").length,
    newContactSubmissions: (fixtures.contactSubmissions || []).filter((submission) => submission.status === "new").length
  };
}

export function getRecentActivity(fixtures) {
  const draftActivities = (fixtures.articles || [])
    .filter((article) => article.status === "draft")
    .map((article) => ({
      actor: "Editor",
      item: article.title,
      status: "Draft",
      timestamp: "Unscheduled",
      nextAction: "Continue editing",
      href: `/admin/articles?edit=${encodeURIComponent(article.slug || article.id)}`
    }));

  const commentActivities = (fixtures.comments || [])
    .filter((comment) => comment.status === "pending")
    .map((comment) => ({
      actor: comment.name,
      item: comment.body,
      status: "Pending comment",
      timestamp: "Moderation queue",
      nextAction: "Review comment",
      href: "/admin/moderation?status=pending"
    }));

  const contactActivities = (fixtures.contactSubmissions || [])
    .filter((submission) => submission.status === "new")
    .map((submission) => ({
      actor: submission.name,
      item: submission.subject,
      status: "New contact submission",
      timestamp: submission.email,
      nextAction: "Open inbox",
      href: "/admin/contact-submissions?status=new"
    }));

  return [...draftActivities, ...commentActivities, ...contactActivities];
}

function metricItems(metrics) {
  return [
    { key: "publishedArticles", label: "Published", value: metrics.publishedArticles },
    { key: "drafts", label: "Drafts", value: metrics.drafts },
    { key: "pendingComments", label: "Awaiting moderation", value: metrics.pendingComments },
    { key: "newContactSubmissions", label: "New submissions", value: metrics.newContactSubmissions }
  ];
}

export function buildAdminDashboardRouteModel(fixtures) {
  const route = getRouteByPath("/admin");
  const metrics = getDashboardMetrics(fixtures);

  return {
    pageId: "admin-dashboard",
    generatedFrom: "admin-dashboard-route-model",
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    auth: {
      required: route.authRequired === true,
      role: "admin",
      loginHref: "/admin/login"
    },
    hero: {
      eyebrow: "Admin",
      title: "Dashboard",
      dek: "Everything that needs your attention, in one place."
    },
    sections: {
      stats: {
        heading: "At a glance",
        items: metricItems(metrics)
      },
      recentActivity: {
        heading: "Recent activity",
        columns: ["Actor", "Item", "Status", "Updated", "Action"],
        items: getRecentActivity(fixtures)
      },
      quickActions: {
        heading: "Quick actions",
        items: [
          { href: "/admin/articles?new=1", label: "Write an article", body: "Open a clean article editor and save a draft." },
          { href: "/admin/moderation?status=pending", label: "Review comments", body: "Publish or deny comments awaiting moderation." },
          { href: "/admin/contact-submissions?status=new", label: "Check submissions", body: "Open new messages from the contact form." }
        ]
      },
      states: {
        notes: ["dashboard-loading", "dashboard-empty", "dashboard-error", "permission-denied"],
        items: ["loading", "empty", "error", "permission-denied"],
        permissionHref: "/admin/login",
        errorCopy: "Dashboard failed to load; retry the request."
      }
    }
  };
}
