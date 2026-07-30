import { getRouteByPath } from "../routes.js";

const STATUS_LABELS = {
  new: "New",
  read: "In progress",
  archived: "Completed"
};

function getReplyHref(submission) {
  return `mailto:${submission.email}?subject=${encodeURIComponent(`Re: ${submission.subject}`)}`;
}

function formatReceivedDate(createdAt) {
  if (!createdAt) return "Date unavailable";
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

export function getSubmissionRows(fixtures) {
  return (fixtures.contactSubmissions || []).map((submission) => ({
    id: submission.id,
    sender: submission.name,
    email: submission.email,
    subject: submission.subject,
    message: submission.message,
    status: submission.status,
    statusLabel: STATUS_LABELS[submission.status] || submission.status,
    receivedDate: formatReceivedDate(submission.createdAt),
    replyHref: getReplyHref(submission)
  }));
}

export function getSubmissionStats(fixtures) {
  const rows = getSubmissionRows(fixtures);
  return {
    totalSubmissions: rows.length,
    newSubmissions: rows.filter((row) => row.status === "new").length,
    inProgressSubmissions: rows.filter((row) => row.status === "read").length,
    completedSubmissions: rows.filter((row) => row.status === "archived").length
  };
}

function metricItems(stats) {
  return [
    { key: "totalSubmissions", label: "All requests", value: stats.totalSubmissions },
    { key: "newSubmissions", label: "New", value: stats.newSubmissions },
    { key: "inProgressSubmissions", label: "In progress", value: stats.inProgressSubmissions },
    { key: "completedSubmissions", label: "Completed", value: stats.completedSubmissions }
  ];
}

export function buildContactSubmissionsRouteModel(fixtures) {
  const route = getRouteByPath("/admin/contact-submissions");
  const rows = getSubmissionRows(fixtures);
  const stats = getSubmissionStats(fixtures);

  return {
    pageId: "contact-submissions",
    generatedFrom: "contact-submissions-route-model",
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
    nav: { newCount: stats.newSubmissions },
    hero: {
      title: "Submissions",
      dek: "Review every contact request and keep its progress clear."
    },
    sections: {
      stats: {
        heading: "Request overview",
        items: metricItems(stats)
      },
      inbox: {
        heading: "Contact requests",
        columns: ["Name", "Request type", "Message", "Status", "Received", "Actions"],
        items: rows
      }
    }
  };
}
